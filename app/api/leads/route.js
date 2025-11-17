// app/api/leads/route.js
import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import Lead from "@/models/Lead";
import Client from "@/models/Client";
import { requireAdmin, handleAuthError } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req) {
  try {
    await requireAdmin();
    await connectMongoose();
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();

    const filter = q
      ? {
          $or: [
            { name: { $regex: q, $options: "i" } },
            { email: { $regex: q, $options: "i" } },
            { phone: { $regex: q, $options: "i" } },
            { company: { $regex: q, $options: "i" } },
          ],
        }
      : {};

    const leads = await Lead.find(filter).sort({ createdAt: -1 }).lean();
    return NextResponse.json(leads, { status: 200 });
  } catch (e) {
    if (e?.status === 401 || e?.status === 403) return handleAuthError(e);
    console.error("leads GET error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await requireAdmin();
    await connectMongoose();
    const body = await req.json();

    const lead = await Lead.create(body);

    if (lead.status === "Converted") {
      await Client.findOneAndUpdate(
        { email: lead.email ?? undefined },
        {
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          companyName: lead.company,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    return NextResponse.json(lead, { status: 201 });
  } catch (e) {
    if (e?.status === 401 || e?.status === 403) return handleAuthError(e);
    console.error("leads POST error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}