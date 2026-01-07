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
            { category: { $regex: q, $options: "i" } },
            { service: { $regex: q, $options: "i" } },
            { source: { $regex: q, $options: "i" } },
            { platform: { $regex: q, $options: "i" } },
            { location: { $regex: q, $options: "i" } },
            { reference: { $regex: q, $options: "i" } },
            { note: { $regex: q, $options: "i" } },
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

    if (body.date) body.date = new Date(body.date);
    if (body.sendingDate) body.sendingDate = new Date(body.sendingDate);
    if (body.followupDate) body.followupDate = new Date(body.followupDate);

    const lead = await Lead.create(body);

    // FIX: Check for "Closed - Won" instead of "Converted"
    if (lead.status === "Closed - Won") {
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