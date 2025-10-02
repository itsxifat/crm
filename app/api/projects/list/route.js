// app/api/projects/list/route.js
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const dateStr = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");
const isValidId = (v) => {
  try {
    return v && ObjectId.isValid(String(v));
  } catch {
    return false;
  }
};

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const page    = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const perPage = Math.min(100, Math.max(1, parseInt(url.searchParams.get("perPage") || "25", 10)));
    const skip    = (page - 1) * perPage;
    const q       = (url.searchParams.get("q") || "").trim();
    const include = (url.searchParams.get("include") || "")
      .split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
    const includeServices = include.includes("services");
    const debug  = url.searchParams.get("debug") === "1";

    const db = await getDb();

    // prefer "projects" collection; fall back to "project" if needed
    const colls = await db.listCollections().toArray();
    const hasProjects = colls.some(c => c.name === "projects");
    const hasProject  = colls.some(c => c.name === "project");
    const collName = hasProjects ? "projects" : (hasProject ? "project" : "projects");
    const coll = db.collection(collName);

    // ---- filter/search (id, name) ----
    const filter = {};
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ id: rx }, { name: rx }];
    }

    const total = await coll.countDocuments(filter).catch(() => coll.estimatedDocumentCount());

    // ---- aggregation pipeline: LOOKUP clients + users ----
    const pipeline = [
      { $match: filter },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: perPage },

      // ensure arrays for lookups
      {
        $addFields: {
          assignedUserIds: {
            $cond: [
              { $and: [{ $isArray: "$assignedUserIds" }, { $gt: [{ $size: "$assignedUserIds" }, 0] }] },
              "$assignedUserIds",
              []
            ]
          }
        }
      },

      // join client
      {
        $lookup: {
          from: "clients",
          localField: "clientId",           // you create with clientId: ObjectId
          foreignField: "_id",
          as: "clientDoc"
        }
      },
      { $unwind: { path: "$clientDoc", preserveNullAndEmptyArrays: true } },

      // join users
      {
        $lookup: {
          from: "users",
          localField: "assignedUserIds",    // you create with assignedUserIds: [ObjectId]
          foreignField: "_id",
          as: "assignedUsers"
        }
      },

      // final projection
      {
        $project: {
          _id: 1,
          id: 1,
          name: { $ifNull: ["$name", ""] },
          status: { $ifNull: ["$status", "In progress"] },
          startDate: 1,
          dueDate: 1,
          totalAmount: { $ifNull: ["$totalAmount", 0] },
          totalCost:   { $ifNull: ["$totalCost", 0] },
          profit:      {
            $cond: [
              { $ne: ["$profit", undefined] },
              { $ifNull: ["$profit", 0] },
              { $subtract: [{ $ifNull: ["$totalAmount", 0] }, { $ifNull: ["$totalCost", 0] }] }
            ]
          },
          sisterConcern: { $ifNull: ["$sisterConcern", ""] },

          // client string for UI (prefer companyName then clientName)
          client: {
            $let: {
              vars: {
                company: { $ifNull: ["$clientDoc.companyName", ""] },
                person:  { $ifNull: ["$clientDoc.clientName",  ""] }
              },
              in: {
                $cond: [{ $ne: ["$$company", ""] }, "$$company",
                  { $cond: [{ $ne: ["$$person", ""] }, "$$person", "—"] }
                ]
              }
            }
          },
          clientId: {
            $cond: [{ $ifNull: ["$clientDoc._id", false] }, { $toString: "$clientDoc._id" }, ""]
          },
          clientName: {                     // back-compat for any old UI reading clientName
            $let: {
              vars: {
                company: { $ifNull: ["$clientDoc.companyName", ""] },
                person:  { $ifNull: ["$clientDoc.clientName",  ""] }
              },
              in: {
                $cond: [{ $ne: ["$$company", ""] }, "$$company",
                  { $cond: [{ $ne: ["$$person", ""] }, "$$person", "—"] }
                ]
              }
            }
          },

          assignedTo: {
            $map: {
              input: "$assignedUsers",
              as: "u",
              in: {
                id: { $toString: "$$u._id" },
                name: {
                  $cond: [
                    { $ne: ["$$u.name", null] },
                    { $cond: [{ $ne: ["$$u.name", "" ] }, "$$u.name",
                      { $ifNull: ["$$u.fullName", { $ifNull: ["$$u.email", { $toString: "$$u._id" }] }] }
                    ]},
                    { $ifNull: ["$$u.fullName", { $ifNull: ["$$u.email", { $toString: "$$u._id" }] }] }
                  ]
                },
                email: { $ifNull: ["$$u.email", ""] },
                avatarUrl: "$$u.avatarUrl"
              }
            }
          },

          services: includeServices ? {
            $map: {
              input: { $ifNull: ["$services", []] },
              as: "s",
              in: {
                description: { $ifNull: ["$$s.description", ""] },
                unit:       { $toDouble: { $ifNull: ["$$s.unit", 0] } },
                unitPrice:  { $toDouble: { $ifNull: ["$$s.unitPrice", 0] } },
                totalPrice: { $toDouble: { $ifNull: ["$$s.totalPrice", 0] } },
                cost:       { $toDouble: { $ifNull: ["$$s.cost", 0] } },
                offerPrice: "$$s.offerPrice",
                note: "$$s.note"
              }
            }
          } : undefined,

          servicesCount: { $size: { $ifNull: ["$services", []] } }
        }
      }
    ];

    const rows = await coll.aggregate(pipeline).toArray();

    // Finish date formatting (ISO yyyy-mm-dd) to match your table
    for (const r of rows) {
      r.startDate = dateStr(r.startDate);
      r.dueDate   = dateStr(r.dueDate);
      // make sure id exists for link
      if (!r.id) r.id = r._id?.toString?.() || "";
      // numbers normalized
      r.totalAmount = Number(r.totalAmount || 0);
      r.totalCost   = Number(r.totalCost || 0);
      r.profit      = Number(r.profit || 0);
      // remove undefined avatarUrl keys
      if (Array.isArray(r.assignedTo)) {
        r.assignedTo = r.assignedTo.map(u => {
          if (!u.avatarUrl) { delete u.avatarUrl; }
          return u;
        });
      }
      // if services not requested, omit it; otherwise keep as-is
      if (!includeServices) delete r.services;
    }

    if (debug) {
      // quick sanity to verify joins happened
      const withClient = rows.filter(r => r.client && r.client !== "—").length;
      const withAssignees = rows.filter(r => Array.isArray(r.assignedTo) && r.assignedTo.length).length;
      return new Response(
        JSON.stringify({
          total, page, perPage,
          summary: { rows: rows.length, withClient, withAssignees },
          sample: rows[0] || null
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ total, page, perPage, rows }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("projects/list error:", err);
    return new Response(JSON.stringify({ error: "Projects list failed" }), { status: 500 });
  }
}
