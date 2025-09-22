// app/api/projects/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/projects
 *  - ?light=1  -> lightweight list (id, name, clientName, totalAmount, status, dates)
 *  - ?q=       -> search by name or id
 *  - ?page=, ?perPage=
 */
export async function GET(req) {
  try {
    const db = await getDb();
    const projectsCol = db.collection("projects");

    const { searchParams } = new URL(req.url);
    const light = searchParams.get("light") === "1";
    const q = (searchParams.get("q") || "").trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get("perPage") || "25", 10)));
    const skip = (page - 1) * perPage;

    const match = {};
    if (q) {
      match.$or = [
        { name: { $regex: q, $options: "i" } },
        { id: { $regex: q, $options: "i" } },
      ];
    }

    // $lookup that can match:
    //  - project.clientId (string OR ObjectId) to clients.id or clients._id
    //  - project.client    (ObjectId)          to clients._id
    const clientLookup = {
      $lookup: {
        from: "clients",
        let: {
          cid: { $ifNull: ["$clientId", "$client"] },
          cidStr: {
            $toString: { $ifNull: ["$clientId", "$client"] }
          }
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  // direct ObjectId to _id
                  { $eq: ["$_id", "$$cid"] },
                  // when project stores string id in clientId
                  { $eq: ["$id", "$$cid"] },
                  // when project stores string of ObjectId in clientId
                  { $eq: [{ $toString: "$_id" }, "$$cidStr"] },
                ],
              },
            },
          },
          { $project: { name: 1, phone: 1, address: 1, id: 1 } },
        ],
        as: "clientDoc",
      },
    };

    if (light) {
      const pipeline = [
        { $match: match },
        { $sort: { createdAt: -1 } },
        clientLookup,
        {
          $project: {
            _id: 1,
            id: { $ifNull: ["$id", { $toString: "$_id" }] },
            name: { $ifNull: ["$name", "Untitled"] },
            status: { $ifNull: ["$status", "In progress"] },
            totalAmount: { $ifNull: ["$totalAmount", 0] },
            clientName: {
              $ifNull: [{ $arrayElemAt: ["$clientDoc.name", 0] }, "—"],
            },
            startDate: {
              $cond: [
                { $ifNull: ["$startDate", false] },
                { $dateToString: { date: "$startDate", format: "%Y-%m-%d" } },
                ""
              ]
            },
            dueDate: {
              $cond: [
                { $ifNull: ["$dueDate", false] },
                { $dateToString: { date: "$dueDate", format: "%Y-%m-%d" } },
                ""
              ]
            },
          },
        },
        { $skip: skip },
        { $limit: perPage },
      ];

      const rows = await projectsCol.aggregate(pipeline).toArray();
      return NextResponse.json({ rows, page, perPage });
    }

    // full listing
    const total = await projectsCol.countDocuments(match);
    const rows = await projectsCol
      .aggregate([
        { $match: match },
        { $sort: { createdAt: -1 } },
        clientLookup,
        {
          $project: {
            _id: 1,
            id: { $ifNull: ["$id", { $toString: "$_id" }] },
            name: { $ifNull: ["$name", "Untitled"] },
            status: { $ifNull: ["$status", "In progress"] },
            startDate: 1,
            dueDate: 1,
            totalAmount: { $ifNull: ["$totalAmount", 0] },
            totalCost: { $ifNull: ["$totalCost", 0] },
            profit: {
              $cond: [
                { $ne: ["$profit", null] },
                "$profit",
                { $subtract: [{ $ifNull: ["$totalAmount", 0] }, { $ifNull: ["$totalCost", 0] }] },
              ],
            },
            clientName: {
              $ifNull: [{ $arrayElemAt: ["$clientDoc.name", 0] }, "—"],
            },
          },
        },
        { $skip: skip },
        { $limit: perPage },
      ])
      .toArray();

    return NextResponse.json({ total, page, perPage, rows });
  } catch (e) {
    console.error("/api/projects GET error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
