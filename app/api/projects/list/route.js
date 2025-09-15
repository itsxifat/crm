import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const toObjectId = (v) => {
  try {
    if (!v) return null;
    if (v instanceof ObjectId) return v;
    const s = String(v);
    return ObjectId.isValid(s) ? new ObjectId(s) : null;
  } catch { return null; }
};
const dateStr = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const include = url.searchParams.get("include")?.split(",").map((s) => s.trim().toLowerCase()) || [];
    const includeServices = include.includes("services");

    const db = (await clientPromise).db(process.env.MONGODB_DB || "en_crm");

    let projects = await db.collection("projects").find({}).sort({ createdAt: -1 }).toArray();
    if (!projects.length) {
      const alt = await db.collection("project").find({}).sort({ createdAt: -1 }).toArray();
      if (alt.length) projects = alt;
    }
    if (!projects.length) {
      return new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    const clientIds = new Set();
    const userIds = new Set();
    for (const p of projects) {
      const cid = toObjectId(p.clientId);
      if (cid) clientIds.add(cid.toString());
      for (const uid of Array.isArray(p.assignedUserIds) ? p.assignedUserIds : []) {
        const oid = toObjectId(uid);
        if (oid) userIds.add(oid.toString());
      }
    }

    const clients = clientIds.size
      ? await db.collection("clients").find({ _id: { $in: [...clientIds].map((id) => new ObjectId(id)) } }).project({ name: 1, email: 1 }).toArray()
      : [];
    const users = userIds.size
      ? await db.collection("users").find({ _id: { $in: [...userIds].map((id) => new ObjectId(id)) } }).project({ name: 1, email: 1 }).toArray()
      : [];

    const clientMap = new Map(clients.map((c) => [c._id.toString(), c]));
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const data = projects.map((p) => {
      const shortId = typeof p.id === "string" && p.id.trim().length ? p.id.trim() : (p._id?.toString?.() ?? "");
      const cid = toObjectId(p.clientId);
      const client = cid ? clientMap.get(cid.toString()) : null;

      const assignedTo = (Array.isArray(p.assignedUserIds) ? p.assignedUserIds : [])
        .map((uid) => toObjectId(uid))
        .filter(Boolean)
        .map((oid) => userMap.get(oid.toString()))
        .filter(Boolean)
        .map((u) => ({ id: u._id.toString(), name: u.name ?? "", email: u.email ?? "" }));

      const totalAmount = Number(p.totalAmount || 0);
      const totalCost = Number(p.totalCost || 0);
      const profit = "profit" in p ? Number(p.profit || 0) : totalAmount - totalCost;
      const servicesArray = Array.isArray(p.services) ? p.services : [];

      const base = {
        id: shortId,
        name: p.name ?? "",
        client: client?.name ?? "",
        clientId: client?._id?.toString() ?? "",
        assignedTo,
        status: p.status ?? "In progress",
        startDate: dateStr(p.startDate),
        dueDate: dateStr(p.dueDate),
        totalAmount,
        totalCost,
        profit,
        servicesCount: servicesArray.length,
      };

      if (includeServices) {
        return {
          ...base,
          services: servicesArray.map((s) => ({
            description: s.description ?? "",
            unit: Number(s.unit || 0),
            unitPrice: Number(s.unitPrice || 0),
            totalPrice: Number(s.totalPrice || 0),
            ...(s.offerPrice !== undefined ? { offerPrice: Number(s.offerPrice || 0) } : {}),
            ...(s.note ? { note: String(s.note) } : {}),
          })),
        };
      }
      return base;
    });

    return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("projects/list error:", err);
    return new Response(JSON.stringify({ error: "Projects list failed" }), { status: 500 });
  }
}
