// app/api/projects/light/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const db = await getDb();

    // Join projects -> clients by either project.clientId (string of _id) OR project.client (ObjectId)
    const rows = await db.collection("projects").aggregate([
      {
        $addFields: {
          // normalize possible refs
          _clientIdStr: {
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
      {
        $lookup: {
          from: "clients",
          let: { key: "$_clientIdStr" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: [{ $toString: "$_id" }, "$$key"] },
                    { $eq: ["$id", "$$key"] } // legacy safety
                  ]
                }
              }
            },
            { $project: { clientName: 1, companyName: 1 } }
          ],
          as: "clientDoc"
        }
      },
      { $unwind: { path: "$clientDoc", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          id: 1,               // if you carry a human id
          name: 1,
          title: 1,
          clientId: 1,
          client: 1,
          clientName: {
            $ifNull: [
              "$clientDoc.clientName",
              "$clientDoc.companyName"
            ]
          }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 500 } // keep it light for the modal
    ]).toArray();

    // Stringify ids for the client
    const safe = rows.map(r => ({
      ...r,
      _id: r._id ? String(r._id) : undefined,
      id: r.id ?? r._id ? String(r._id) : undefined,
      clientName: r.clientName || "—",
    }));

    return NextResponse.json({ rows: safe });
  } catch (e) {
    console.error("projects/light GET error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
