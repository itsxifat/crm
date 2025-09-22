// app/api/invoices/route.js
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import puppeteer from "puppeteer";
import { renderInvoiceHTML, formatMoney } from "./_template";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function getCurrencySymbol() {
  return process.env.CURRENCY_SYMBOL || "৳";
}

async function getOrigin() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") || "http";
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  return `${proto}://${host}`;
}

function nextInvoiceId(n = 6) {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < n; i++) s += abc[Math.floor(Math.random() * abc.length)];
  const y = new Date().getFullYear();
  return `INV-${y}-${s}`;
}

function clientDisplayName(c) {
  return (c?.companyName || c?.clientName || c?.email || "Client").trim();
}

/** ------------------------------ GET: list ------------------------------ **/
export async function GET(req) {
  try {
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
    console.error("invoices GET error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** ------------------------------ POST: create ------------------------------ **/
export async function POST(req) {
  try {
    const db = await getDb();
    const body = await req.json().catch(() => ({}));
    const { source, sourceId, taxPct = 0, items } = body;

    if (!source || !sourceId) {
      return NextResponse.json({ error: "source and sourceId are required" }, { status: 400 });
    }

    const currency = getCurrencySymbol();
    const origin = await getOrigin();
    const logoUrl = `${origin}/logo.png`;

    let clientDoc = null;
    let finalItems = [];
    let baseNotes = "";

    if (source === "project") {
      const q = ObjectId.isValid(sourceId) ? { _id: new ObjectId(sourceId) } : { id: sourceId };
      const project = await db.collection("projects").findOne(q);
      if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

      const clientKey = project.clientId || project.client || null;
      clientDoc =
        (clientKey &&
          (await db
            .collection("clients")
            .findOne(ObjectId.isValid(clientKey) ? { _id: new ObjectId(clientKey) } : { id: clientKey }))) ||
        null;

      const services = Array.isArray(project.services) ? project.services : [];
      finalItems = services.map((s, idx) => {
        const qty = Number(s.unit || 0);
        const unitPrice = Number(s.unitPrice || 0);
        const total = s.totalPrice != null ? Number(s.totalPrice || 0) : qty * unitPrice;
        return {
          orderId: s.orderId || `#${idx + 1}`,
          description: s.description || "Service",
          qty,
          unitPrice,
          total,
        };
      });

      baseNotes = `Auto-generated from project: ${project.name || project.id}`;
    } else if (source === "client") {
      const cq = ObjectId.isValid(sourceId) ? { _id: new ObjectId(sourceId) } : { id: sourceId };
      clientDoc = await db.collection("clients").findOne(cq);
      if (!clientDoc) return NextResponse.json({ error: "Client not found" }, { status: 404 });

      if (!Array.isArray(items) || !items.length) {
        // fallback – sum projects for this client into one line
        const projects = await db
          .collection("projects")
          .find({
            $or: [
              { clientId: String(clientDoc._id) },
              { clientId: clientDoc.id },
              { client: clientDoc._id },
            ],
          })
          .toArray();

        const sum = projects.reduce((acc, p) => acc + Number(p.totalAmount || 0), 0);
        finalItems = [
          {
            orderId: "",
            description: `Accumulated amount for ${clientDisplayName(clientDoc)} (${projects.length} project${projects.length === 1 ? "" : "s"})`,
            qty: 1,
            unitPrice: sum,
            total: sum,
          },
        ];
      } else {
        finalItems = items.map((it, i) => ({
          orderId: it.orderId || `#${i + 1}`,
          description: it.description || "Item",
          qty: Number(it.qty || 0),
          unitPrice: Number(it.unitPrice || 0),
          total: Number(it.total || Number(it.qty || 0) * Number(it.unitPrice || 0)),
        }));
      }

      baseNotes = `Auto-generated for client: ${clientDisplayName(clientDoc)}`;
    } else {
      return NextResponse.json({ error: "Invalid source" }, { status: 400 });
    }

    const subtotal = finalItems.reduce((a, it) => a + Number(it.total || 0), 0);
    const tax = Math.round((Number(taxPct || 0) / 100) * subtotal * 100) / 100;
    const total = subtotal + tax;

    const invoiceId = nextInvoiceId();
    const now = new Date();
    const dateISO = now.toISOString().slice(0, 10);

    // HTML (with company + client names)
    const html = renderInvoiceHTML({
      logoUrl,
      dateISO,
      invoiceId,
      currency,
      invoiceTo: { name: clientDisplayName(clientDoc) },
      billTo: {
        name: clientDisplayName(clientDoc),
        phone: clientDoc?.phone || "",
        address: [clientDoc?.address?.line1, clientDoc?.address?.line2, clientDoc?.address?.city, clientDoc?.address?.state, clientDoc?.address?.postalCode, clientDoc?.address?.country]
          .filter(Boolean)
          .join(", "),
      },
      items: finalItems,
      subtotal,
      taxPct: Number(taxPct || 0),
      tax,
      total,
      notes: baseNotes,
    });

    // PDF
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: "new",
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "14mm", bottom: "16mm", left: "12mm", right: "12mm" },
    });
    await page.close();
    await browser.close();

    // Save
    const doc = {
      invoiceId,
      source,
      sourceId: String(sourceId),
      clientId: clientDoc?._id || null,
      clientName: clientDisplayName(clientDoc),
      clientPhone: clientDoc?.phone || "",
      clientAddress:
        [clientDoc?.address?.line1, clientDoc?.address?.line2, clientDoc?.address?.city, clientDoc?.address?.state, clientDoc?.address?.postalCode, clientDoc?.address?.country]
          .filter(Boolean)
          .join(", "),
      items: finalItems,
      subtotal,
      taxPct: Number(taxPct || 0),
      tax,
      total,
      currency,
      status: "Created",
      createdAt: now,
      pdf: new Uint8Array(pdfBuffer),
    };

    const { insertedId } = await db.collection("invoices").insertOne(doc);
    const origin2 = await getOrigin();

    return NextResponse.json({
      ok: true,
      invoice: {
        ...doc,
        _id: insertedId,
        pdfUrl: `${origin2}/api/invoices/${insertedId}/pdf`,
      },
    });
  } catch (e) {
    console.error("invoices POST error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
