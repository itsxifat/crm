import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function normalizeServices(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((s) => s && typeof s.description === "string" && s.description.trim().length)
    .map((s) => {
      const unit = Number(s.unit) || 0;
      const unitPrice = Number(s.unitPrice) || 0;
      const totalPrice = unit * unitPrice;
      const offer = s.offerPrice !== undefined && s.offerPrice !== null && s.offerPrice !== ""
        ? Number(s.offerPrice) || 0
        : undefined;
      const note = typeof s.note === "string" && s.note.trim() ? s.note.trim() : undefined;
      return {
        description: s.description.trim(),
        unit,
        unitPrice,
        totalPrice,
        ...(offer !== undefined ? { offerPrice: offer } : {}),
        ...(note !== undefined ? { note } : {}),
      };
    });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      id,
      _id,
      name,
      clientId,
      assignedUserIds = [],
      startDate,
      dueDate,
      services = [],
      totalCost = 0,
      status = "In progress",
    } = body;

    if (!id && !_id) {
      return NextResponse.json({ error: "id (ENV) or _id is required" }, { status: 400 });
    }

    const db = await getDb();
    const where = id ? { id } : { _id: new ObjectId(_id) };

    const cleaned = normalizeServices(services);
    const totalAmount = cleaned.reduce((sum, s) => {
      const val = s.offerPrice !== undefined ? s.offerPrice : s.totalPrice;
      return sum + (Number(val) || 0);
    }, 0);

    const costNum = Number(totalCost) || 0;
    const profit = totalAmount - costNum;

    const $set = {
      ...(name !== undefined ? { name } : {}),
      ...(clientId !== undefined ? { clientId: ObjectId.isValid(clientId) ? new ObjectId(clientId) : null } : {}),
      ...(assignedUserIds
        ? { assignedUserIds: assignedUserIds.filter(ObjectId.isValid).map((x) => new ObjectId(x)) }
        : {}),
      ...(startDate !== undefined ? { startDate: startDate ? new Date(startDate) : null } : {}),
      ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
      ...(services !== undefined ? { services: cleaned } : {}),
      ...(status !== undefined ? { status } : {}),
      totalAmount,
      totalCost: costNum,
      profit,
      updatedAt: new Date(),
    };

    await db.collection("projects").updateOne(where, { $set });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("projects/update error:", e);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}
