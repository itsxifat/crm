// app/api/invoices/route.js
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { renderInvoiceHTML, formatMoney } from "./_template";
import { htmlToPdfBuffer } from "@/lib/puppeteer";
import { requireAdmin, handleAuthError } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ---------- helpers ---------- */
function getCurrencySymbol() {
  return process.env.CURRENCY_SYMBOL || "৳";
}

async function getOrigin() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") || (process.env.VERCEL ? "https" : "http");
  const host = h.get("x-forwarded-host") || h.get("host") || process.env.VERCEL_URL || "localhost:3000";
  return `${proto}://${host}`;
}

function nextInvoiceId(n = 6) {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < n; i++) s += abc[Math.floor(Math.random() * abc.length)];
  return `INV-${new Date().getFullYear()}-${s}`;
}

function clientDisplayName(c) {
  return (c?.companyName || c?.clientName || c?.name || c?.email || "Client").trim();
}

function round2(n) {
  return Math.round(Number(n || 0) * 100) / 100;
}

function calcProjectTotal(p = {}) {
  if (p.totalAmount != null && !Number.isNaN(Number(p.totalAmount))) {
    return round2(p.totalAmount);
  }
  const sv = Array.isArray(p.services) ? p.services : [];
  return round2(
    sv.reduce((sum, s) => {
      if (!s) return sum;
      if (s.offerPrice != null && !Number.isNaN(Number(s.offerPrice))) return sum + Number(s.offerPrice);
      if (s.totalPrice != null && !Number.isNaN(Number(s.totalPrice))) return sum + Number(s.totalPrice);
      const u = Number(s.unit || 0);
      const up = Number(s.unitPrice || 0);
      return sum + u * up;
    }, 0)
  );
}

/** Ensure unique indexes (safe if already exist) */
async function ensureInvoiceIndexes(db) {
  try {
    await db.collection("invoices").createIndexes([
      {
        key: { source: 1, sourceId: 1 },
        name: "uniq_project_invoice",
        unique: true,
        partialFilterExpression: { source: "project", sourceId: { $exists: true } },
      },
      {
        key: { source: 1, clientId: 1 },
        name: "uniq_client_invoice",
        unique: true,
        partialFilterExpression: { source: "client", clientId: { $exists: true } },
      },
    ]);
  } catch {
    // ignore "already exists" races
  }
}

/** Create a project invoice from a project doc (services), return the created invoice */
async function createProjectInvoiceFromProject({ db, project, clientDoc, currency, logoUrl, paidStampUrl }) {
  const services = Array.isArray(project.services) ? project.services : [];
  const items = services.map((s, i) => {
    const qty = Number(s.unit || 0);
    const unitPrice = Number(s.unitPrice) || 0;
    const total =
      s.offerPrice != null
        ? Number(s.offerPrice || 0)
        : s.totalPrice != null
        ? Number(s.totalPrice || 0)
        : qty * unitPrice;
    return {
      orderId: s.orderId || `#${i + 1}`,
      description: s.description || "Service",
      qty,
      unitPrice,
      total,
    };
  });

  const subtotal = round2(items.reduce((a, it) => a + Number(it.total || 0), 0));
  const taxPct = 0;
  const tax = 0;
  const total = round2(subtotal + tax);

  const invoiceId = nextInvoiceId();
  const now = new Date();
  const dateISO = now.toISOString().slice(0, 10);

  const invoiceTo = {
    companyName: clientDisplayName(clientDoc),
    clientName: "",
    phone: clientDoc?.phone || "",
    address: [
      clientDoc?.address?.line1,
      clientDoc?.address?.line2,
      clientDoc?.address?.city,
      clientDoc?.address?.state,
      clientDoc?.address?.postalCode,
      clientDoc?.address?.country,
    ].filter(Boolean).join(", "),
  };

  const html = renderInvoiceHTML({
    logoUrl,
    dateISO,
    invoiceId,
    currency,
    invoiceTo,
    items,
    subtotal,
    taxPct,
    tax,
    total,
    payments: [],
    paidTotal: 0,
    dueTotal: total,
    status: "Created",
    notes: `Auto-generated from project: ${project.name || project.id}`,
    paidStampUrl,
    clientProjects: [], // not used for project invoices
  });

  const pdfBuffer = await htmlToPdfBuffer(html);

  const doc = {
    invoiceId,
    source: "project",
    sourceId: String(project._id || project.id),
    clientId: clientDoc?._id || null,
    clientName: clientDisplayName(clientDoc),
    clientPhone: invoiceTo.phone,
    clientAddress: invoiceTo.address,
    items,
    subtotal,
    taxPct,
    tax,
    total,
    currency,
    status: "Created",
    payments: [],
    paidAmount: 0,
    balanceDue: total,
    createdAt: now,
    updatedAt: now,
    pdf: new Uint8Array(pdfBuffer),
  };

  const { insertedId } = await db.collection("invoices").insertOne(doc);
  return { ...doc, _id: insertedId };
}

/** Get an existing project invoice or create it from the project doc */
async function getOrCreateProjectInvoice({ db, project, clientDoc, currency, logoUrl, paidStampUrl }) {
  const pid = String(project._id || project.id);
  const existing = await db.collection("invoices").findOne({ source: "project", sourceId: pid });
  if (existing) return existing;
  return await createProjectInvoiceFromProject({ db, project, clientDoc, currency, logoUrl, paidStampUrl });
}

/* ---------- GET: list (no pdf payloads) ---------- */
export async function GET(req) {
  try {
    await requireAdmin();
    const db = await getDb();
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const perPage = Math.min(100, Math.max(1, Number(searchParams.get("perPage") || 20)));

    const filter = q
      ? { $or: [{ invoiceId: { $regex: q, $options: "i" } }, { clientName: { $regex: q, $options: "i" } }] }
      : {};

    const total = await db.collection("invoices").countDocuments(filter);
    const rows = await db
      .collection("invoices")
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .project({ pdf: 0 })
      .toArray();

    const origin = await getOrigin();
    const currency = getCurrencySymbol();
    const mapped = rows.map((r) => ({
      ...r,
      currency,
      pdfUrl: `${origin}/api/invoices/${r._id}/pdf`,
      totalFormatted: formatMoney(r.total, currency),
      createdAt: r.createdAt,
    }));

    return NextResponse.json({ total, page, perPage, rows: mapped });
  } catch (e) {
    if (e?.status === 401 || e?.status === 403) return handleAuthError(e);
    console.error("invoices GET error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ---------- POST: create (project | client) with real data & duplicate prevention ---------- */
export async function POST(req) {
  try {
    await requireAdmin();
    const db = await getDb();
    await ensureInvoiceIndexes(db);

    const body = await req.json().catch(() => ({}));
    const { source, sourceId, taxPct = 0 } = body;

    if (!source || !sourceId) {
      return NextResponse.json({ error: "source and sourceId are required" }, { status: 400 });
    }

    const origin = await getOrigin();
    const logoUrl = `${origin}/logo.png`;
    const paidStampUrl = `${origin}/paid-stamp.png`;
    const currency = getCurrencySymbol();

    /* ---- PROJECT invoice (re-use if exists) ---- */
    if (source === "project") {
      const pid = ObjectId.isValid(sourceId) ? { _id: new ObjectId(sourceId) } : { id: sourceId };

      const existing = await db
        .collection("invoices")
        .findOne({ source: "project", sourceId: String(pid._id || pid.id || sourceId) });
      if (existing) {
        return NextResponse.json({
          ok: true,
          invoice: { ...existing, pdfUrl: `${origin}/api/invoices/${existing._id}/pdf` },
        });
      }

      const project = await db.collection("projects").findOne(pid);
      if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

      const clientKey = project.clientId || project.client || null;
      const clientDoc =
        (clientKey &&
          (await db
            .collection("clients")
            .findOne(
              ObjectId.isValid(clientKey)
                ? { _id: new ObjectId(clientKey) }
                : { $or: [{ id: clientKey }, { _id: clientKey }] }
            ))) ||
        null;

      const created = await getOrCreateProjectInvoice({
        db,
        project,
        clientDoc,
        currency,
        logoUrl,
        paidStampUrl,
      });

      return NextResponse.json({
        ok: true,
        invoice: { ...created, pdfUrl: `${origin}/api/invoices/${created._id}/pdf` },
      });
    }

    /* ---- CLIENT invoice (re-use if exists; values from project invoices only) ---- */
    if (source === "client") {
      const cq = ObjectId.isValid(sourceId) ? { _id: new ObjectId(sourceId) } : { id: sourceId };
      const clientDoc = await db.collection("clients").findOne(cq);
      if (!clientDoc) return NextResponse.json({ error: "Client not found" }, { status: 404 });

      const existingClientInv = await db
        .collection("invoices")
        .findOne({ source: "client", clientId: clientDoc._id });
      if (existingClientInv) {
        return NextResponse.json({
          ok: true,
          invoice: { ...existingClientInv, pdfUrl: `${origin}/api/invoices/${existingClientInv._id}/pdf` },
        });
      }

      const key = String(clientDoc._id || clientDoc.id || "");
      const projFilter = {
        $or: [
          { clientId: clientDoc._id },
          { client: clientDoc._id },
          { clientId: key },
          { client: key },
          ...(ObjectId.isValid(key) ? [{ clientId: new ObjectId(key) }, { client: new ObjectId(key) }] : []),
        ],
      };
      const projects = await db.collection("projects").find(projFilter).toArray();

      // Ensure a project invoice exists per project
      const childInvoices = [];
      for (const p of projects) {
        const inv = await getOrCreateProjectInvoice({
          db,
          project: p,
          clientDoc,
          currency,
          logoUrl,
          paidStampUrl,
        });
        childInvoices.push(inv);
      }

      const projectNameById = new Map(projects.map((p) => [String(p._id), p.name || "Unnamed Project"]));

      const clientProjects = childInvoices.map((ci) => {
        const total = round2(ci.total || 0);
        const paid = round2(ci.paidAmount || 0);
        const due = Math.max(0, round2(total - paid));
        return {
          projectId: String(ci.sourceId),
          name: projectNameById.get(String(ci.sourceId)) || "Unnamed Project",
          total,
          paid,
          due,
          services: [],
        };
      });

      const items = clientProjects.map((p) => ({
        orderId: p.projectId,
        description: p.name,
        qty: 1,
        unitPrice: p.total,
        total: p.total,
      }));

      const subtotal = round2(items.reduce((a, it) => a + Number(it.total || 0), 0));
      const tax = round2((Number(taxPct || 0) / 100) * subtotal);
      const total = round2(subtotal + tax);
      const paidTotal = round2(clientProjects.reduce((a, p) => a + p.paid, 0));
      const dueTotal = Math.max(0, round2(total - paidTotal));
      const status = dueTotal === 0 ? "Paid" : "Created";

      const invoiceId = nextInvoiceId();
      const now = new Date();
      const dateISO = now.toISOString().slice(0, 10);

      const invoiceTo = {
        companyName: clientDisplayName(clientDoc),
        clientName: "",
        phone: clientDoc?.phone || "",
        address: [
          clientDoc?.address?.line1,
          clientDoc?.address?.line2,
          clientDoc?.address?.city,
          clientDoc?.address?.state,
          clientDoc?.address?.postalCode,
          clientDoc?.address?.country,
        ].filter(Boolean).join(", "),
      };

      const html = renderInvoiceHTML({
        logoUrl,
        dateISO,
        invoiceId,
        currency,
        invoiceTo,
        items,
        subtotal,
        taxPct: Number(taxPct || 0),
        tax,
        total,
        notes: `Aggregated from ${projects.length} project${projects.length === 1 ? "" : "s"} for ${clientDisplayName(clientDoc)}`,
        payments: [],
        paidTotal,
        dueTotal,
        status,
        paidStampUrl,
        clientProjects,
      });

      const pdfBuffer = await htmlToPdfBuffer(html);

      const doc = {
        invoiceId,
        source: "client",
        sourceId: String(clientDoc._id),
        clientId: clientDoc._id,
        clientName: clientDisplayName(clientDoc),
        clientPhone: invoiceTo.phone,
        clientAddress: invoiceTo.address,
        items,
        subtotal,
        taxPct: Number(taxPct || 0),
        tax,
        total,
        currency,
        status,
        payments: [],
        paidAmount: paidTotal,
        balanceDue: dueTotal,
        clientProjects,
        createdAt: now,
        updatedAt: now,
        pdf: new Uint8Array(pdfBuffer),
      };

      const { insertedId } = await db.collection("invoices").insertOne(doc);

      return NextResponse.json({
        ok: true,
        invoice: { ...doc, _id: insertedId, pdfUrl: `${origin}/api/invoices/${insertedId}/pdf` },
      });
    }

    return NextResponse.json({ error: "Invalid source" }, { status: 400 });
  } catch (e) {
    if (e?.status === 401 || e?.status === 403) return handleAuthError(e);
    // unique-index race: return the existing doc
    if (e?.code === 11000) {
      try {
        const db = await getDb();
        const body = await req.json().catch(() => ({}));
        const { source, sourceId } = body || {};
        const origin = await getOrigin();

        if (source === "project") {
          const pid = ObjectId.isValid(sourceId) ? String(new ObjectId(sourceId)) : String(sourceId);
          const inv = await db.collection("invoices").findOne({ source: "project", sourceId: pid });
          if (inv) return NextResponse.json({ ok: true, invoice: { ...inv, pdfUrl: `${origin}/api/invoices/${inv._id}/pdf` } });
        } else if (source === "client") {
          const cid = ObjectId.isValid(sourceId) ? new ObjectId(sourceId) : sourceId;
          const inv = await db.collection("invoices").findOne({ source: "client", clientId: cid });
          if (inv) return NextResponse.json({ ok: true, invoice: { ...inv, pdfUrl: `${origin}/api/invoices/${inv._id}/pdf` } });
        }
      } catch {}
    }

    console.error("invoices POST error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}