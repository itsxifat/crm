// app/api/expenses/[id]/files/receipt/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { requireAdmin, handleAuthError } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_req, { params }) {
  try {
    await requireAdmin();
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const db = await getDb();
    const doc = await db.collection("expenses").findOne(
      { _id: new ObjectId(id) },
      { projection: { receipt: 1 } }
    );

    if (!doc?.receipt?.data) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const file = doc.receipt;
    const binary = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data);

    return new NextResponse(binary, {
      headers: {
        "Content-Type": file.mimetype || "application/octet-stream",
        "Content-Disposition": `inline; filename="${file.filename || "receipt"}"`,
        "Content-Length": String(file.size || binary.length),
        "Cache-Control": "private, max-age=0, no-store",
      },
    });
  } catch (e) {
    if (e?.status === 401 || e?.status === 403) return handleAuthError(e);
    console.error("GET /api/expenses/[id]/files/receipt error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}