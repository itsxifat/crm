// app/api/clients/lookup/route.js
import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import Client from "@/models/Client";
import { requireAdmin, handleAuthError } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req) {
  try {
    await requireAdmin(); // block non-admins

    const url = new URL(req.url);
    const idsParam = (url.searchParams.get("ids") || "").trim();
    if (!idsParam) {
      return NextResponse.json({ clients: [] }, { status: 200 });
    }

    const rawIds = idsParam.split(",").map(s => s.trim()).filter(Boolean);
    if (rawIds.length === 0) {
      return NextResponse.json({ clients: [] }, { status: 200 });
    }

    await connectMongoose();

    // Mongoose will coerce strings to ObjectId if valid
    const rows = await Client.find({ _id: { $in: rawIds } })
      .select("companyName clientName email phone") // keep it light
      .lean()
      .exec();

    const clients = rows.map((c) => {
      const id = String(c._id);
      const name = (c.companyName && c.companyName.trim())
        ? c.companyName
        : (c.clientName || "");
      return {
        _id: id,
        id,
        name,
        email: c.email || "",
        phone: c.phone || ""
      };
    });

    return NextResponse.json({ clients }, { status: 200 });
  } catch (e) {
    if (e?.status === 401 || e?.status === 403) return handleAuthError(e);
    console.error("clients/lookup GET error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
