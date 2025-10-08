// app/api/projects/list/route.js
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const dateStr = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");

function toIdOrString(v) {
  if (!v) return null;
  const s = String(v);
  return ObjectId.isValid(s) ? new ObjectId(s) : s;
}

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
    const clientIdParam = (url.searchParams.get("clientId") || "").trim();

    const db = await getDb();

    // prefer "projects"; fall back to "project" if needed
    const colls = await db.listCollections().toArray();
    const hasProjects = colls.some(c => c.name === "projects");
    const hasProject  = colls.some(c => c.name === "project");
    const coll = db.collection(hasProjects ? "projects" : (hasProject ? "project" : "projects"));

    // ---- filter/search (id, name) ----
    const filter = {};
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ id: rx }, { name: rx }];
    }

    // ---- robust clientId filter (supports ObjectId + string, and fields clientId/client) ----
    if (clientIdParam) {
      const key = toIdOrString(clientIdParam);
      const ors = [];

      if (key instanceof ObjectId) {
        ors.push(
          { clientId: key }, { client: key },
          { clientId: String(key) }, { client: String(key) }
        );
      } else {
        ors.push({ clientId: key }, { client: key });
        if (ObjectId.isValid(clientIdParam)) {
          const asObj = new ObjectId(clientIdParam);
          ors.push({ clientId: asObj }, { client: asObj }, { clientId: clientIdParam }, { client: clientIdParam });
        }
      }

      if (ors.length) {
        if (filter.$or) {
          filter.$and = [{ $or: filter.$or }, { $or: ors }];
          delete filter.$or;
        } else {
          filter.$or = ors;
        }
      }
    }

    const total = await coll.countDocuments(filter).catch(() => coll.estimatedDocumentCount());

    // ---- aggregation pipeline: LOOKUP client (robust) + users ----
    const pipeline = [
      { $match: filter },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: perPage },

      // Ensure arrays for user lookup later
      {
        $addFields: {
          assignedUserIds: {
            $cond: [
              { $and: [{ $isArray: "$assignedUserIds" }, { $gt: [{ $size: "$assignedUserIds" }, 0] }] },
              "$assignedUserIds",
              []
            ]
          },
          // Build a single comparable client key (string) from either clientId or client
          _clientKeyStr: {
            $let: {
              vars: {
                cid: { $ifNull: ["$clientId", null] },
                c:   { $ifNull: ["$client",   null] }
              },
              in: {
                $cond: [
                  { $ne: ["$$cid", null] },
                  { $toString: "$$cid" },
                  {
                    $cond: [
                      { $ne: ["$$c", null] },
                      { $toString: "$$c" },
                      null
                    ]
                  }
                ]
              }
            }
          }
        }
      },

      // Robust client lookup:
      // - matches when clients._id string equals the project clientKey
      // - OR when clients.id equals the project clientKey (legacy)
      {
        $lookup: {
          from: "clients",
          let: { ck: "$_clientKeyStr" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $ne: ["$$ck", null] },
                    {
                      $or: [
                        { $eq: [{ $toString: "$_id" }, "$$ck"] },
                        { $eq: ["$id", "$$ck"] }
                      ]
                    }
                  ]
                }
              }
            },
            {
              $project: {
                _id: 1,
                companyName: 1,
                clientName: 1,
                email: 1,
                phone: 1,
                address: 1,
                id: 1
              }
            }
          ],
          as: "clientDoc"
        }
      },
      { $unwind: { path: "$clientDoc", preserveNullAndEmptyArrays: true } },

      // join users
      {
        $lookup: {
          from: "users",
          localField: "assignedUserIds",
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
                $cond: [
                  { $ne: ["$$company", ""] }, "$$company",
                  { $cond: [{ $ne: ["$$person", ""] }, "$$person", "—"] }
                ]
              }
            }
          },

          // ClientId for UI/links/filters as string:
          clientId: {
            $cond: [
              { $ifNull: ["$clientDoc._id", false] },
              { $toString: "$clientDoc._id" },
              { $ifNull: ["$_clientKeyStr", ""] }
            ]
          },

          clientName: {
            $let: {
              vars: {
                company: { $ifNull: ["$clientDoc.companyName", ""] },
                person:  { $ifNull: ["$clientDoc.clientName",  ""] }
              },
              in: {
                $cond: [
                  { $ne: ["$$company", ""] }, "$$company",
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
                    {
                      $cond: [
                        { $ne: ["$$u.name", "" ] }, "$$u.name",
                        { $ifNull: ["$$u.fullName", { $ifNull: ["$$u.email", { $toString: "$$u._id" }] }] }
                      ]
                    },
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

    // normalization for UI
    for (const r of rows) {
      r.startDate = dateStr(r.startDate);
      r.dueDate   = dateStr(r.dueDate);
      if (!r.id) r.id = r._id?.toString?.() || "";
      r.totalAmount = Number(r.totalAmount || 0);
      r.totalCost   = Number(r.totalCost || 0);
      r.profit      = Number(r.profit || 0);
      if (Array.isArray(r.assignedTo)) {
        r.assignedTo = r.assignedTo.map(u => {
          if (!u.avatarUrl) delete u.avatarUrl;
          return u;
        });
      }
      if (!includeServices) delete r.services;
    }

    if (debug) {
      const withClient = rows.filter(r => r.client && r.client !== "—").length;
      const withAssignees = rows.filter(r => Array.isArray(r.assignedTo) && r.assignedTo.length).length;
      const forClient = clientIdParam ? rows.length : undefined;
      return new Response(
        JSON.stringify({
          total, page, perPage,
          summary: { rows: rows.length, withClient, withAssignees, filteredByClient: forClient },
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
