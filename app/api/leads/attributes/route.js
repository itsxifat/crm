import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import LeadAttribute from "@/models/LeadAttribute";
import { requireAdmin, handleAuthError } from "@/lib/requireAdmin";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
    await connectMongoose();
    
    const attributes = await LeadAttribute.find({}).sort({ name: 1 });
    
    return NextResponse.json({
      services: attributes.filter(a => a.type === 'service').map(a => a.name),
      categories: attributes.filter(a => a.type === 'category').map(a => a.name),
      sources: attributes.filter(a => a.type === 'source').map(a => a.name),
      platforms: attributes.filter(a => a.type === 'platform').map(a => a.name),
      references: attributes.filter(a => a.type === 'reference').map(a => a.name),
    });
  } catch (e) {
    if (e?.status === 401 || e?.status === 403) return handleAuthError(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await requireAdmin();
    await connectMongoose();
    const { type, name } = await req.json();

    if (!name || !type) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    await LeadAttribute.findOneAndUpdate(
      { type, name },
      { type, name },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e?.status === 401 || e?.status === 403) return handleAuthError(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await requireAdmin();
    await connectMongoose();
    
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const name = searchParams.get("name");

    if (!name || !type) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const deleted = await LeadAttribute.findOneAndDelete({ type, name });

    if (!deleted) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e?.status === 401 || e?.status === 403) return handleAuthError(e);
    console.error("Attribute delete error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}