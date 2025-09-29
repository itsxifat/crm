// app/api/clients/list/route.js
import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import Client from "@/models/Client";
import { requireAdmin, handleAuthError } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req) {
  try {
    await requireAdmin(); // ⟵ blocks non-admin

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get("perPage") || "25", 10)));
    const skip = (page - 1) * perPage;

    await connectMongoose();

    // Build match (regex-based; works without text index)
    let match = {};
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      match = {
        $or: [
          { companyName: rx },
          { clientName: rx },
          { email: rx },
          { phone: rx },
          { "address.line1": rx },
          { "address.city": rx },
          { "address.state": rx },
          { "address.postalCode": rx },
          { "address.country": rx },
        ],
      };
    }

    // Projection: keep only light fields (skip binary/file subdocs entirely)
    const PROJECTION = "companyName clientName email phone priority createdAt updatedAt"; // _id included by default

    const totalPromise = q ? Client.countDocuments(match) : Client.estimatedDocumentCount();

    const rowsPromise = Client.find(match)
      .select(PROJECTION)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(perPage)
      .lean()
      .exec();

    const [total, rows] = await Promise.all([totalPromise, rowsPromise]);

    const out = rows.map((c) => {
      const id = String(c._id);
      const name = (c.companyName && c.companyName.trim())
        ? c.companyName
        : (c.clientName || "");
      return {
        id,
        _id: id,
        name,
        companyName: c.companyName || "",
        clientName: c.clientName || "",
        email: c.email || "",
        phone: c.phone || "",
        priority: c.priority || "Normal",
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      };
    });

    return NextResponse.json({ total, page, perPage, rows: out }, { status: 200 });
  } catch (e) {
    if (e?.status === 401 || e?.status === 403) return handleAuthError(e);
    console.error("clients/list GET error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
