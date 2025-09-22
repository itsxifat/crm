// app/api/invoices/[id]/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function DELETE(_req, ctx) {
  try {
    const { id } = await ctx.params; // ✅ must await in Next.js 15+
    const db = await getDb();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid invoice id" }, { status: 400 });
    }

    const res = await db.collection("invoices").deleteOne({ _id: new ObjectId(id) });

    if (!res.deletedCount) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, deletedCount: res.deletedCount });
  } catch (e) {
    console.error("invoice DELETE error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
