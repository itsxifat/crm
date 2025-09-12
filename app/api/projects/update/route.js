// app/api/projects/update/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      id,
      name,
      clientId,
      assignedUserIds,
      startDate,
      dueDate,
      totalAmount,
      totalCost,
      status,
    } = body;

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Valid id is required" }, { status: 400 });
    }

    const update = { updatedAt: new Date() };

    if (name !== undefined) update.name = name;
    if (clientId !== undefined) {
      if (!ObjectId.isValid(clientId)) {
        return NextResponse.json({ error: "Invalid clientId" }, { status: 400 });
      }
      update.clientId = new ObjectId(clientId);
    }
    if (assignedUserIds !== undefined) {
      update.assignedUserIds = (assignedUserIds || [])
        .filter((uid) => ObjectId.isValid(uid))
        .map((uid) => new ObjectId(uid));
    }
    if (startDate !== undefined) update.startDate = startDate ? new Date(startDate) : null;
    if (dueDate !== undefined) update.dueDate = dueDate ? new Date(dueDate) : null;

    // Recompute profit if amounts provided
    if (totalAmount !== undefined) update.totalAmount = Number(totalAmount) || 0;
    if (totalCost !== undefined) update.totalCost = Number(totalCost) || 0;
    if (totalAmount !== undefined || totalCost !== undefined) {
      const ta = update.totalAmount ?? 0;
      const tc = update.totalCost ?? 0;
      update.profit = ta - tc;
    }

    if (status !== undefined) update.status = status;

    const db = await getDb();
    await db.collection("projects").updateOne({ _id: new ObjectId(id) }, { $set: update });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("projects/update error:", e);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}
