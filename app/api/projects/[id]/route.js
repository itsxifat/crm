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

    let proj = await db.collection("projects").findOne({ id });
    if (!proj && ObjectId.isValid(id)) {
      proj = await db.collection("projects").findOne({ _id: new ObjectId(id) });
    }
    if (!proj) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const toDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");
    const out = {
      id: proj.id || String(proj._id),
      name: proj.name ?? "",
      clientId: String(proj.clientId ?? ""),
      assignedUserIds: (proj.assignedUserIds || []).map(String),
      status: proj.status ?? "In progress",
      startDate: toDate(proj.startDate),
      dueDate: toDate(proj.dueDate),
      services: Array.isArray(proj.services) ? proj.services.map((s) => ({
        description: s.description ?? "",
        unit: Number(s.unit || 0),
        unitPrice: Number(s.unitPrice || 0),
        totalPrice: Number(s.totalPrice || 0),
        ...(s.offerPrice !== undefined ? { offerPrice: Number(s.offerPrice || 0) } : {}),
        ...(s.note ? { note: String(s.note) } : {}),
      })) : [],
      totalAmount: Number(proj.totalAmount || 0),
      totalCost: Number(proj.totalCost || 0),
      profit: Number(typeof proj.profit === "number" ? proj.profit : (Number(proj.totalAmount || 0) - Number(proj.totalCost || 0))),
      createdAt: proj.createdAt,
      updatedAt: proj.updatedAt,
    };

    return NextResponse.json(out);
  } catch (e) {
    console.error("projects/[id] error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
