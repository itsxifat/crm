import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/** -------------------------- GET: fetch project -------------------------- */
export async function GET(_req, ctx) {
  try {
    const { id } = await ctx.params;
    const db = await getDb();

    const proj = ObjectId.isValid(id)
      ? await db.collection("projects").findOne({ _id: new ObjectId(id) })
      : await db.collection("projects").findOne({ id });

    if (!proj) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const toDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");
    const out = {
      id: proj.id || String(proj._id),
      name: proj.name ?? "",
      clientId: String(proj.clientId ?? proj.client ?? ""),
      assignedUserIds: (proj.assignedUserIds ?? proj.assignedTo ?? []).map(String),
      status: proj.status ?? "Pending",
      startDate: toDate(proj.startDate),
      dueDate: toDate(proj.dueDate),
      services: Array.isArray(proj.services)
        ? proj.services.map((s) => ({
            description: s.description ?? "",
            unit: Number(s.unit || 0),
            unitPrice: Number(s.unitPrice || 0),
            totalPrice: Number(s.totalPrice || 0),
            ...(s.offerPrice !== undefined ? { offerPrice: Number(s.offerPrice || 0) } : {}),
            ...(s.note ? { note: String(s.note) } : {}),
          }))
        : [],
      totalAmount: Number(proj.totalAmount || 0),
      totalCost: Number(proj.totalCost || 0),
      profit:
        typeof proj.profit === "number"
          ? proj.profit
          : Number(proj.totalAmount || 0) - Number(proj.totalCost || 0),
      createdAt: proj.createdAt,
      updatedAt: proj.updatedAt,
    };

    return NextResponse.json(out);
  } catch (e) {
    console.error("projects/[id] GET error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** -------------------------- PATCH: update status -------------------------- */
const ALLOWED = ["Pending", "In-progress", "Completed", "On hold", "Canceled", "Revision"];

export async function PATCH(req, ctx) {
  try {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const status = body?.status;

    if (!ALLOWED.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Allowed: ${ALLOWED.join(", ")}` },
        { status: 400 }
      );
    }

    const db = await getDb();
    const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id };

    const { value: proj } = await db.collection("projects").findOneAndUpdate(
      query,
      { $set: { status, updatedAt: new Date() } },
      { returnDocument: "after", upsert: false }
    );

    if (!proj) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const toDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");
    const out = {
      id: proj.id || String(proj._id),
      name: proj.name ?? "",
      clientId: String(proj.clientId ?? proj.client ?? ""),
      assignedUserIds: (proj.assignedUserIds ?? proj.assignedTo ?? []).map(String),
      status: proj.status ?? "Pending",
      startDate: toDate(proj.startDate),
      dueDate: toDate(proj.dueDate),
      services: Array.isArray(proj.services)
        ? proj.services.map((s) => ({
            description: s.description ?? "",
            unit: Number(s.unit || 0),
            unitPrice: Number(s.unitPrice || 0),
            totalPrice: Number(s.totalPrice || 0),
            ...(s.offerPrice !== undefined ? { offerPrice: Number(s.offerPrice || 0) } : {}),
            ...(s.note ? { note: String(s.note) } : {}),
          }))
        : [],
      totalAmount: Number(proj.totalAmount || 0),
      totalCost: Number(proj.totalCost || 0),
      profit:
        typeof proj.profit === "number"
          ? proj.profit
          : Number(proj.totalAmount || 0) - Number(proj.totalCost || 0),
      createdAt: proj.createdAt,
      updatedAt: proj.updatedAt,
    };

    return NextResponse.json({ ok: true, project: out });
  } catch (e) {
    console.error("projects/[id] PATCH error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** -------------------------- DELETE: delete project -------------------------- */
export async function DELETE(_req, ctx) {
  try {
    const { id } = await ctx.params;
    const db = await getDb();
    const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id };
    const result = await db.collection("projects").deleteOne(query);

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, deletedCount: result.deletedCount });
  } catch (e) {
    console.error("projects/[id] DELETE error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
