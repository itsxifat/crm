// app/api/projects/create/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { formatEnvId, todayKey } from "@/lib/makeProjectId";

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
      const cost = Number(s.cost) || 0; // NEW
      return {
        description: s.description.trim(),
        unit,
        unitPrice,
        totalPrice,
        cost, // NEW
        ...(offer !== undefined ? { offerPrice: offer } : {}),
        ...(note !== undefined ? { note } : {}),
      };
    });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      name,
      clientId,
      assignedUserIds = [],
      startDate,
      dueDate,
      services = [],
      totalCost = 0, // will be overridden by services cost sum if present
      status = "In progress",
      sisterConcern = "", // NEW
    } = body;

    if (!name || !clientId) {
      return NextResponse.json({ error: "name and clientId are required" }, { status: 400 });
    }
    if (!ObjectId.isValid(clientId)) {
      return NextResponse.json({ error: "Invalid clientId" }, { status: 400 });
    }

    const db = await getDb();

    // daily sequence
    const counters = db.collection("counters");
    const key = `project:${todayKey()}`;
    const { value: counterDoc } = await counters.findOneAndUpdate(
      { _id: key },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: "after" }
    );
    const envId = formatEnvId(new Date(), counterDoc.seq);

    const cleaned = normalizeServices(services);

    const totalAmount = cleaned.reduce((sum, s) => {
      const val = s.offerPrice !== undefined ? s.offerPrice : s.totalPrice;
      return sum + (Number(val) || 0);
    }, 0);

    // NEW: prefer per-service cost sum; fall back to provided totalCost
    const costFromServices = cleaned.reduce((sum, s) => sum + (Number(s.cost) || 0), 0);
    const costNum = costFromServices > 0 ? costFromServices : (Number(totalCost) || 0);

    const profit = totalAmount - costNum;

    const doc = {
      id: envId,
      name,
      clientId: new ObjectId(clientId),
      assignedUserIds: assignedUserIds
        .filter((id) => ObjectId.isValid(id))
        .map((id) => new ObjectId(id)),
      status,
      startDate: startDate ? new Date(startDate) : null,
      dueDate: dueDate ? new Date(dueDate) : null,
      services: cleaned,
      totalAmount,
      totalCost: costNum,
      profit,
      sisterConcern, // NEW
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("projects").insertOne(doc);
    db.collection("projects").createIndex({ id: 1 }, { unique: true }).catch(() => {});
    return NextResponse.json({ id: envId, _id: String(result.insertedId), success: true }, { status: 201 });
  } catch (e) {
    console.error("projects/create error:", e);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
