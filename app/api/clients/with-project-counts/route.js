// app/api/clients/with-project-counts/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const db = await getDb();

    // 1) Build a normalized key for projects -> client
    const counts = await db.collection("projects").aggregate([
      {
        $project: {
          clientKey: {
            $cond: [
              { $ifNull: ["$clientId", false] },
              { $toString: "$clientId" },
              {
                $cond: [
                  { $ifNull: ["$client", false] },
                  { $toString: "$client" },
                  null
                ]
              }
            ]
          }
        }
      },
      { $match: { clientKey: { $ne: null } } },
      { $group: { _id: "$clientKey", projectCount: { $sum: 1 } } },
      { $sort: { projectCount: -1 } }
    ]).toArray();

    if (!counts.length) return NextResponse.json({ rows: [] });

    // 2) Load clients by _id (and by custom `id` if present)
    const keys = counts.map(c => c._id);
    const byObjectIds = keys.filter(ObjectId.isValid).map(k => new ObjectId(k));

    const clients = await db.collection("clients").find({
      $or: [
        { _id: { $in: byObjectIds } },
        { id: { $in: keys } } // only if some data used a custom `id` in the past
      ]
    }).project({
      companyName: 1,
      clientName: 1,
      email: 1,
      phone: 1,
      address: 1,
      id: 1
    }).toArray();

    const rows = counts.map(c => {
      const key = c._id;
      const client =
        clients.find(cl => String(cl._id) === key) ||
        clients.find(cl => String(cl.id) === key) ||
        null;

      const displayName = client
        ? (client.companyName || client.clientName || client.email || "Client")
        : "Client";

      return {
        _id: client?._id || null,                 // always prefer ObjectId
        id: client?.id || (client?._id ? String(client._id) : key),
        name: displayName,
        phone: client?.phone || "",
        address: client?.address || "",
        projectCount: c.projectCount || 0
      };
    });

    return NextResponse.json({ rows });
  } catch (e) {
    console.error("clients with-project-counts GET error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
