import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_req, ctx) {
  try {
    const { id } = await ctx.params;
    const db = await getDb();
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid invoice id" }, { status: 400 });
    }

    const inv = await db.collection("invoices").findOne({ _id: new ObjectId(id) });
    if (!inv || !inv.pdf) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const data = inv.pdf?.buffer ? Buffer.from(inv.pdf.buffer) : Buffer.from(inv.pdf);
    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${inv.invoiceId || "invoice"}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("invoice pdf GET error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
