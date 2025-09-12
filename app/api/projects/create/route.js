// app/api/projects/create/route.js
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
      name,
      clientId,
      assignedUserIds = [],
      startDate,
      dueDate,
      totalAmount = 0,
      totalCost = 0,
      status = "In progress",
    } = body;

    if (!name || !clientId) {
      return NextResponse.json(
        { error: "name and clientId are required" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(clientId)) {
      return NextResponse.json({ error: "Invalid clientId" }, { status: 400 });
    }

    const db = await getDb();
    const profit = Number(totalAmount || 0) - Number(totalCost || 0);

    const doc = {
      name,
      clientId: new ObjectId(clientId),
      assignedUserIds: assignedUserIds
        .filter((id) => ObjectId.isValid(id))
        .map((id) => new ObjectId(id)),
      status,
      startDate: startDate ? new Date(startDate) : null,
      dueDate: dueDate ? new Date(dueDate) : null,
      totalAmount: Number(totalAmount) || 0,
      totalCost: Number(totalCost) || 0,
      profit,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("projects").insertOne(doc);
    return NextResponse.json({ id: String(result.insertedId), success: true }, { status: 201 });
  } catch (e) {
    console.error("projects/create error:", e);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
