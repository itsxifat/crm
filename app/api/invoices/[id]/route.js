// app/api/invoices/[id]/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { renderInvoiceHTML } from "../_template";
import { headers } from "next/headers";
import { htmlToPdfBuffer } from "@/lib/puppeteer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ---------------- utils ---------------- */
async function getOrigin() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") || (process.env.VERCEL ? "https" : "http");
  const host =
    h.get("x-forwarded-host") || h.get("host") || process.env.VERCEL_URL || "localhost:3000";
  return `${proto}://${host}`;
}
function round2(n) {
  return Math.round(Number(n || 0) * 100) / 100;
}
function safeDateISO(dLike) {
  return String(dLike || new Date().toISOString().slice(0, 10)).slice(0, 10);
}

/** How to compute a single project's "total" when invoices are missing */
function calcProjectTotalFromDoc(p = {}) {
  if (p.totalAmount != null && !Number.isNaN(Number(p.totalAmount))) {
    return Number(p.totalAmount);
  }
  const services = Array.isArray(p.services) ? p.services : [];
  if (!services.length) return 0;
  return services.reduce((sum, s) => {
    if (s == null) return sum;
    if (s.offerPrice != null && !Number.isNaN(Number(s.offerPrice))) {
      return sum + Number(s.offerPrice);
    }
    if (s.totalPrice != null && !Number.isNaN(Number(s.totalPrice))) {
      return sum + Number(s.totalPrice);
    }
    const unit = Number(s.unit || 0);
    const unitPrice = Number(s.unitPrice || 0);
    return sum + unit * unitPrice;
  }, 0);
}

/**
 * Build a fresh, accurate clientProjects[] for a client invoice.
 * Each entry: { projectId, name, total, paid, due, services[] }
 */
async function buildClientProjects(db, clientId) {
  if (!clientId) return [];

  // Load all projects that belong to this client (robust match)
  const clientKeyStr = String(clientId);
  const projFilter = {
    $or: [
      { clientId: clientId }, // ObjectId exact
      { client: clientId }, // ObjectId exact
      { clientId: clientKeyStr }, // stored as string
      { client: clientKeyStr }, // stored as string
      ...(ObjectId.isValid(clientKeyStr)
        ? [{ clientId: new ObjectId(clientKeyStr) }, { client: new ObjectId(clientKeyStr) }]
        : []),
    ],
  };
  const projects = await db.collection("projects").find(projFilter).toArray();
  if (!projects.length) return [];

  // For all these project _ids, fetch all project invoices
  const projIds = projects.map((p) => String(p._id));
  const projectInvoices = await db
    .collection("invoices")
    .find({ source: "project", sourceId: { $in: projIds } })
    .project({ sourceId: 1, total: 1, paidAmount: 1 })
    .toArray();

  const byProjectId = projectInvoices.reduce((map, inv) => {
    const k = String(inv.sourceId);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(inv);
    return map;
  }, new Map());

  const clientProjects = projects.map((p) => {
    const pid = String(p._id);
    const invoices = byProjectId.get(pid) || [];

    const invTotal = invoices.reduce((a, x) => a + Number(x.total || 0), 0);
    const invPaid = invoices.reduce((a, x) => a + Number(x.paidAmount || 0), 0);

    const total = invoices.length ? invTotal : calcProjectTotalFromDoc(p);
    const paid = invoices.length ? invPaid : 0;
    const due = Math.max(0, round2(total - paid));

    return {
      projectId: pid,
      name: p.name || "Unnamed Project",
      total: round2(total),
      paid: round2(paid),
      due: round2(due),
      services: Array.isArray(p.services) ? p.services : [],
    };
  });

  return clientProjects;
}

/* ---------------- GET: JSON invoice details (without pdf blob) ---------------- */
export async function GET(_req, ctx) {
  try {
    const { id } = await ctx.params;
    if (!ObjectId.isValid(id))
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const db = await getDb();
    const inv = await db
      .collection("invoices")
      .findOne({ _id: new ObjectId(id) }, { projection: { pdf: 0 } });

    if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Always enrich clientProjects on read (no write)
    let enriched = inv.clientProjects || [];
    if (String(inv.source || "").toLowerCase() === "client" && inv.clientId) {
      enriched = await buildClientProjects(db, inv.clientId);
    }

    const origin = await getOrigin();
    return NextResponse.json({
      ...inv,
      clientProjects: enriched,
      _id: inv._id,
      pdfUrl: `${origin}/api/invoices/${inv._id}/pdf`,
    });
  } catch (e) {
    console.error("invoice GET error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ---------------- PATCH: record payment, regenerate PDFs, and sync parent/children ---------------- */
export async function PATCH(req, ctx) {
  try {
    const { id } = await ctx.params;
    if (!ObjectId.isValid(id))
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const db = await getDb();
    const inv = await db.collection("invoices").findOne({ _id: new ObjectId(id) });
    if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    let { dateISO, amount, note, markFullPaid, allocation } = body || {};

    const safeDate = safeDateISO(dateISO);
    const total = round2(inv.total);
    const alreadyPaid = round2(inv.paidAmount || 0);
    const currentDue = Math.max(0, round2(total - alreadyPaid));

    // Determine addAmount
    let addAmount = round2(amount || 0);

    if (String(inv.source || "").toLowerCase() !== "client") {
      if (markFullPaid) addAmount = currentDue;
    } else {
      if (markFullPaid && allocation) {
        const freshCP = await buildClientProjects(db, inv.clientId);
        const byId = new Map(freshCP.map((p) => [String(p.projectId), Number(p.due || 0)]));
        if (allocation.mode === "single" && allocation.projectIds?.length) {
          addAmount = round2(byId.get(String(allocation.projectIds[0])) || 0);
        } else if (allocation.mode === "multiple" && allocation.projectIds?.length) {
          addAmount = round2(
            allocation.projectIds.reduce(
              (s, pid) => s + Number(byId.get(String(pid)) || 0),
              0
            )
          );
        } else if (allocation.mode === "splitAll" || allocation.mode === "split") {
          addAmount = round2(freshCP.reduce((s, p) => s + Number(p.due || 0), 0));
        }
      }
    }

    if (!(addAmount > 0)) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    if (addAmount - currentDue > 1e-8) {
      return NextResponse.json({ error: "Amount exceeds due" }, { status: 400 });
    }

    // add payment entry to current invoice
    const prevPayments = Array.isArray(inv.payments) ? inv.payments : [];
    const newPayments = [
      ...prevPayments,
      { dateISO: safeDate, amount: addAmount, note: note || "" },
    ];

    const newPaid = round2(alreadyPaid + addAmount);
    const newDue = Math.max(0, round2(total - newPaid));
    const newStatus = newDue === 0 ? "Paid" : inv.status || "Created";

    const origin = await getOrigin();
    const logoUrl = `${origin}/logo.png`;
    const paidStampUrl = `${origin}/paid-stamp.png`;

    async function renderAndStore(invoiceDoc) {
      const html = renderInvoiceHTML({
        logoUrl,
        dateISO: invoiceDoc.createdAt
          ? new Date(invoiceDoc.createdAt).toISOString().slice(0, 10)
          : safeDate,
        invoiceId: invoiceDoc.invoiceId,
        currency: invoiceDoc.currency || "৳",
        invoiceTo: {
          companyName: invoiceDoc.clientName || "",
          clientName: "",
          phone: invoiceDoc.clientPhone || "",
          address: invoiceDoc.clientAddress || "",
        },
        items: Array.isArray(invoiceDoc.items) ? invoiceDoc.items : [],
        subtotal: round2(invoiceDoc.subtotal || 0),
        taxPct: round2(invoiceDoc.taxPct || 0),
        tax: round2(invoiceDoc.tax || 0),
        total: round2(invoiceDoc.total || 0),
        notes: "",
        payments: (Array.isArray(invoiceDoc.payments) ? invoiceDoc.payments : []).map((p) => ({
          dateISO: p.dateISO,
          amount: p.amount,
        })),
        paidTotal: round2(invoiceDoc.paidAmount || 0),
        dueTotal: round2(invoiceDoc.balanceDue || 0),
        status: invoiceDoc.status || "Created",
        paidStampUrl,
        clientProjects: Array.isArray(invoiceDoc.clientProjects) ? invoiceDoc.clientProjects : [],
      });

      const pdfBuffer = await htmlToPdfBuffer(html);

      await db.collection("invoices").updateOne(
        { _id: invoiceDoc._id },
        { $set: { pdf: new Uint8Array(pdfBuffer) } }
      );
    }

    // 1) update current invoice
    const now = new Date();
    await db.collection("invoices").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          payments: newPayments,
          paidAmount: newPaid,
          balanceDue: newDue,
          status: newStatus,
          updatedAt: now,
        },
      }
    );

    // 2) allocation for CLIENT invoice -> update child PROJECT invoices
    if (String(inv.source || "").toLowerCase() === "client" && allocation) {
      const freshCP = await buildClientProjects(db, inv.clientId);
      const childProjectIds = freshCP.map((p) => String(p.projectId));

      const children = await db
        .collection("invoices")
        .find({ source: "project", sourceId: { $in: childProjectIds } })
        .toArray();

      const childById = new Map(children.map((c) => [String(c.sourceId), c]));
      const remainingDue = (c) =>
        Math.max(0, round2(Number(c.total || 0) - Number(c.paidAmount || 0)));

      // Build per-child allocation map
      const perChild = new Map();

      const pickTargets = (ids) =>
        ids.map(String).map((pid) => childById.get(pid)).filter(Boolean);

      if (allocation.mode === "single" && allocation.projectIds?.length) {
        const pid = String(allocation.projectIds[0]);
        const target = childById.get(pid);
        if (target) {
          const take = Math.min(addAmount, remainingDue(target));
          if (take > 0) perChild.set(pid, round2(take));
        }
      } else if (allocation.mode === "multiple" && allocation.projectIds?.length) {
        const targets = pickTargets(allocation.projectIds);

        if (allocation.splitEvenly) {
          const n = targets.length || 1;
          let remain = addAmount;
          for (const t of targets) {
            const pid = String(t.sourceId);
            const equal = round2(addAmount / n);
            const take = Math.min(equal, remainingDue(t), remain);
            perChild.set(pid, round2(take));
            remain = round2(remain - take);
          }
          if (remain > 0) {
            for (const t of targets) {
              const pid = String(t.sourceId);
              const cap = remainingDue(t);
              const already = perChild.get(pid) || 0;
              const can = Math.min(remain, Math.max(0, round2(cap - already)));
              if (can > 0) {
                perChild.set(pid, round2(already + can));
                remain = round2(remain - can);
                if (remain <= 0) break;
              }
            }
          }
        } else {
          // proportional by remaining due
          const targets = pickTargets(allocation.projectIds);
          const dues = targets.map(remainingDue);
          const totalDue = dues.reduce((a, v) => a + v, 0) || 1;
          let remain = addAmount;
          for (let i = 0; i < targets.length; i++) {
            const t = targets[i];
            const pid = String(t.sourceId);
            const share = round2((dues[i] / totalDue) * addAmount);
            const take = Math.min(share, remainingDue(t), remain);
            perChild.set(pid, round2(take));
            remain = round2(remain - take);
          }
          if (remain > 0) {
            for (let i = 0; i < targets.length; i++) {
              const t = targets[i];
              const pid = String(t.sourceId);
              const cap = remainingDue(t);
              const already = perChild.get(pid) || 0;
              const can = Math.min(remain, Math.max(0, round2(cap - already)));
              if (can > 0) {
                perChild.set(pid, round2(already + can));
                remain = round2(remain - can);
                if (remain <= 0) break;
              }
            }
          }
        }
      } else if (allocation.mode === "splitAll" || allocation.mode === "split") {
        const targets = children;
        const n = targets.length || 1;
        let remain = addAmount;
        for (const t of targets) {
          const pid = String(t.sourceId);
          const equal = round2(addAmount / n);
          const take = Math.min(equal, remainingDue(t), remain);
          perChild.set(pid, round2(take));
          remain = round2(remain - take);
        }
        if (remain > 0) {
          for (const t of targets) {
            const pid = String(t.sourceId);
            const cap = remainingDue(t);
            const already = perChild.get(pid) || 0;
            const can = Math.min(remain, Math.max(0, round2(cap - already)));
            if (can > 0) {
              perChild.set(pid, round2(already + can));
              remain = round2(remain - can);
              if (remain <= 0) break;
            }
          }
        }
      }

      // apply to children & regenerate each PDF
      for (const child of children) {
        const pid = String(child.sourceId);
        const inc = round2(perChild.get(pid) || 0);
        if (!(inc > 0)) continue;

        const cp = Array.isArray(child.payments) ? child.payments : [];
        const cPaid = round2(Number(child.paidAmount || 0) + inc);
        const cDue = Math.max(0, round2(Number(child.total || 0) - cPaid));
        const cStatus = cDue === 0 ? "Paid" : child.status || "Created";

        await db.collection("invoices").updateOne(
          { _id: child._id },
          {
            $set: {
              payments: [...cp, { dateISO: safeDate, amount: inc, note: note || "" }],
              paidAmount: cPaid,
              balanceDue: cDue,
              status: cStatus,
              updatedAt: new Date(),
            },
          }
        );

        const updatedChild = await db.collection("invoices").findOne({ _id: child._id });
        await renderAndStore(updatedChild);
      }

      // refresh & persist clientProjects on parent
      const refreshedClientProjects = await buildClientProjects(db, inv.clientId);
      await db.collection("invoices").updateOne(
        { _id: new ObjectId(id) },
        { $set: { clientProjects: refreshedClientProjects } }
      );
    }

    // 3) when PROJECT invoice changes, re-sync all client invoices of this client
    if (String(inv.source || "").toLowerCase() === "project" && inv.clientId) {
      const childProjs = await db
        .collection("invoices")
        .find({ source: "project", clientId: inv.clientId })
        .toArray();

      const totalSum = round2(childProjs.reduce((a, x) => a + Number(x.total || 0), 0));
      const paidSum = round2(childProjs.reduce((a, x) => a + Number(x.paidAmount || 0), 0));
      const dueSum = Math.max(0, round2(totalSum - paidSum));
      const statusAgg = dueSum === 0 ? "Paid" : "Created";

      const clientInvoices = await db
        .collection("invoices")
        .find({ source: "client", clientId: inv.clientId })
        .toArray();

      const refreshedClientProjects = await buildClientProjects(db, inv.clientId);

      for (const ci of clientInvoices) {
        await db.collection("invoices").updateOne(
          { _id: ci._id },
          {
            $set: {
              paidAmount: paidSum,
              balanceDue: dueSum,
              status: statusAgg,
              clientProjects: refreshedClientProjects,
              updatedAt: new Date(),
            },
          }
        );
        const refreshed = await db.collection("invoices").findOne({ _id: ci._id });
        await renderAndStore(refreshed);
      }
    }

    // 4) regenerate current invoice PDF
    const refreshedCurrent = await db.collection("invoices").findOne({ _id: new ObjectId(id) });
    if (String(refreshedCurrent.source || "").toLowerCase() === "client" && refreshedCurrent.clientId) {
      const freshCP = await buildClientProjects(db, refreshedCurrent.clientId);
      await db.collection("invoices").updateOne(
        { _id: refreshedCurrent._id },
        { $set: { clientProjects: freshCP } }
      );
      refreshedCurrent.clientProjects = freshCP;
    }
    await renderAndStore(refreshedCurrent);

    return NextResponse.json({
      ok: true,
      status: refreshedCurrent.status,
      paidAmount: refreshedCurrent.paidAmount,
      balanceDue: refreshedCurrent.balanceDue,
    });
  } catch (e) {
    console.error("invoice PATCH error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ---------------- DELETE ---------------- */
export async function DELETE(_req, ctx) {
  try {
    const { id } = await ctx.params;
    if (!ObjectId.isValid(id))
      return NextResponse.json({ error: "Invalid invoice id" }, { status: 400 });

    const db = await getDb();
    const res = await db.collection("invoices").deleteOne({ _id: new ObjectId(id) });
    if (!res.deletedCount) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ ok: true, deletedCount: res.deletedCount });
  } catch (e) {
    console.error("invoice DELETE error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
