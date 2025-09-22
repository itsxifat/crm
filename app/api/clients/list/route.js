// app/api/clients/list/route.js
import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import Client from "@/models/Client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get("perPage") || "25", 10)));
    const skip = (page - 1) * perPage;

    await connectMongoose();

    const text = [];
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      text.push(
        { companyName: rx },
        { clientName: rx },
        { email: rx },
        { phone: rx },
        { "address.line1": rx },   // ✅ fixed
        { "address.city": rx },
        { "address.state": rx },
        { "address.postalCode": rx },
        { "address.country": rx }
      );
    }

    const match = q ? { $or: text } : {};

    const [total, rows] = await Promise.all([
      Client.countDocuments(match),
      Client.find(match)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .lean()
        .exec(),
    ]);

    const out = rows.map((c) => ({
      _id: String(c._id),
      companyName: c.companyName || "",
      clientName: c.clientName || "",
      email: c.email || "",
      phone: c.phone || "",
      priority: c.priority || "Normal",
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    return NextResponse.json({ total, page, perPage, rows: out });
  } catch (e) {
    console.error("clients/list GET error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
