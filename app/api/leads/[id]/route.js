import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import Lead from "@/models/Lead";
import Client from "@/models/Client";
import { requireAdmin, handleAuthError } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_, { params }) {
  try {
    await requireAdmin();
    await connectMongoose();
    const { id } = await params;
    const lead = await Lead.findById(id).lean();
    if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(lead, { status: 200 });
  } catch (e) {
    if (e?.status === 401 || e?.status === 403) return handleAuthError(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    await requireAdmin();
    await connectMongoose();
    const { id } = await params;
    const body = await req.json();

    // Date parsing
    if (body.date) body.date = new Date(body.date);
    if (body.sendingDate) body.sendingDate = new Date(body.sendingDate);
    if (body.followupDate) body.followupDate = new Date(body.followupDate);

    const lead = await Lead.findByIdAndUpdate(id, body, { new: true });

    // Auto-convert to Client if Won
    if (lead?.status === "Closed - Won" && lead?.email) {
      await Client.findOneAndUpdate(
        { email: lead.email },
        {
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          companyName: lead.company,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    return NextResponse.json(lead, { status: 200 });
  } catch (e) {
    if (e?.status === 401 || e?.status === 403) return handleAuthError(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_, { params }) {
  try {
    await requireAdmin();
    await connectMongoose();
    const { id } = await params;
    await Lead.findByIdAndDelete(id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e) {
    if (e?.status === 401 || e?.status === 403) return handleAuthError(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}