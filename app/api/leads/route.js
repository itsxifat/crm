// app/api/leads/route.js
import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import Lead from "@/models/Lead";
import Client from "@/models/Client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req) {
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
}

export async function POST(req) {
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
}
