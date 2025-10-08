// app/api/projects/list/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function calcProjectTotal(p = {}) {
  if (p.totalAmount != null && !Number.isNaN(Number(p.totalAmount))) {
    return Number(p.totalAmount);
  }
  const sv = Array.isArray(p.services) ? p.services : [];
  return sv.reduce((sum, s) => {
    const unit = Number(s?.unit || 0);
    const unitPrice = Number(s?.unitPrice || 0);
    const line = s?.offerPrice ?? s?.totalPrice ?? (unit * unitPrice);
    return sum + Number(line || 0);
  }, 0);
}

export async function GET(req) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(req.url);

    const q = (searchParams.get("q") || "").trim();
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const perPage = Math.min(100, Math.max(1, Number(searchParams.get("perPage") || 50)));
    const light = searchParams.get("light"); // when present, return slim projection

    const filter = q
      ? { $or: [{ name: { $regex: q, $options: "i" } }, { id: { $regex: q, $options: "i" } }] }
      : {};

    const cursor = db.collection("projects")
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    const rows = light
      ? await cursor.project({ name: 1, id: 1, clientName: 1, clientId: 1, client: 1 }).toArray()
      : await cursor.toArray();

    const enriched = rows.map((p) => ({
      ...p,
      totalAmountComputed: calcProjectTotal(p),
    }));

    const total = await db.collection("projects").countDocuments(filter);

    return NextResponse.json({
      total,
      page,
      perPage,
      rows: enriched,
    });
  } catch (e) {
    console.error("projects/list GET error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
