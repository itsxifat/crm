// app/api/projects/[id]/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ---------------- helpers ---------------- */
const toDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");
const toObjectId = (v) => {
  try {
    if (!v) return null;
    if (v instanceof ObjectId) return v;
    const s = String(v);
    return ObjectId.isValid(s) ? new ObjectId(s) : null;
  } catch {
    return null;
  }
};

async function enrichProject(db, projDoc) {
  if (!projDoc) return null;

  // Resolve client
  const clientOid = toObjectId(projDoc.clientId ?? projDoc.client);
  let clientDoc = null;
  if (clientOid) {
    clientDoc = await db
      .collection("clients")
      .findOne(
        { _id: clientOid },
        { projection: { companyName: 1, clientName: 1, email: 1, phone: 1 } }
      );
  }
  const clientName =
    (clientDoc?.companyName && clientDoc.companyName.trim()) ||
    clientDoc?.clientName ||
    "—";
  const clientIdStr = clientDoc?._id ? clientDoc._id.toString() : (clientOid ? clientOid.toString() : "");

  // Resolve users
  const assignedRaw = Array.isArray(projDoc.assignedUserIds)
    ? projDoc.assignedUserIds
    : Array.isArray(projDoc.assignedTo)
    ? projDoc.assignedTo
    : [];
  const userOids = assignedRaw.map(toObjectId).filter(Boolean);

  let userDocs = [];
  if (userOids.length) {
    userDocs = await db
      .collection("users")
      .find(
        { _id: { $in: userOids } },
        { projection: { name: 1, fullName: 1, email: 1, avatarUrl: 1 } }
      )
      .toArray();
  }
  const userMap = new Map(userDocs.map((u) => [u._id.toString(), u]));
  const assignedTo = userOids.map((oid) => {
    const u = userMap.get(oid.toString());
    return u
      ? {
          id: u._id.toString(),
          name: u.name || u.fullName || u.email || u._id.toString(),
          email: u.email || "",
          ...(u.avatarUrl ? { avatarUrl: u.avatarUrl } : {}),
        }
      : { id: oid.toString(), name: oid.toString() };
  });

  // Numbers & dates
  const totalAmount = Number(projDoc.totalAmount || 0);
  const totalCost = Number(projDoc.totalCost || 0);
  const profit =
    typeof projDoc.profit === "number" ? Number(projDoc.profit || 0) : totalAmount - totalCost;

  // Services normalization (preserve your current shape)
  const services = Array.isArray(projDoc.services)
    ? projDoc.services.map((s) => ({
        description: s?.description ?? "",
        unit: Number(s?.unit || 0),
        unitPrice: Number(s?.unitPrice || 0),
        totalPrice: Number(s?.totalPrice || 0),
        ...(s?.cost !== undefined ? { cost: Number(s?.cost || 0) } : {}),
        ...(s?.offerPrice !== undefined ? { offerPrice: Number(s?.offerPrice || 0) } : {}),
        ...(s?.note ? { note: String(s?.note) } : {}),
      }))
    : [];

  return {
    // base fields (keep your current keys)
    _id: projDoc._id?.toString?.() || "",
    id: projDoc.id || String(projDoc._id),
    name: projDoc.name ?? "",
    clientId: clientIdStr || String(projDoc.clientId ?? projDoc.client ?? ""),
    assignedUserIds: assignedRaw.map((v) => (toObjectId(v) ? toObjectId(v).toString() : String(v))),
    status: projDoc.status ?? "Pending",
    startDate: toDate(projDoc.startDate),
    dueDate: toDate(projDoc.dueDate),
    services,
    totalAmount,
    totalCost,
    profit,
    sisterConcern: projDoc.sisterConcern || "",
    createdAt: projDoc.createdAt,
    updatedAt: projDoc.updatedAt,

    // enriched fields for UI
    client: clientName,
    clientName: clientName, // back-compat
    assignedTo,
  };
}

/* -------------------------- GET: fetch project -------------------------- */
export async function GET(_req, ctx) {
  try {
    const { id } = await ctx.params;
    const db = await getDb();

    // Find by env id or by _id
    let proj =
      ObjectId.isValid(id)
        ? await db.collection("projects").findOne({ _id: new ObjectId(id) })
        : await db.collection("projects").findOne({ id });

    if (!proj) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const out = await enrichProject(db, proj);
    return NextResponse.json(out);
  } catch (e) {
    console.error("projects/[id] GET error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* -------------------------- PATCH: update status -------------------------- */
const ALLOWED = ["Pending", "In-progress", "Completed", "On hold", "Canceled", "Revision", "In progress"];

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

    const out = await enrichProject(db, proj);
    return NextResponse.json({ ok: true, project: out });
  } catch (e) {
    console.error("projects/[id] PATCH error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* -------------------------- DELETE: delete project -------------------------- */
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
