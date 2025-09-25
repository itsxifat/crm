// app/api/expenses/list/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb"; // make sure this path matches your project
import { ObjectId } from "mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get("perPage") || "50", 10)));
    const skip = (page - 1) * perPage;

    const db = await getDb();
    const col = db.collection("expenses");

    const match = {};
    if (q) {
      const ors = [
        { title: { $regex: q, $options: "i" } },
        { details: { $regex: q, $options: "i" } },
        { projectId: { $regex: q, $options: "i" } },
        { projectName: { $regex: q, $options: "i" } },
        { whoSpentName: { $regex: q, $options: "i" } },
        { whereSpent: { $regex: q, $options: "i" } },
      ];
      if (ObjectId.isValid(q)) {
        ors.push({ _id: new ObjectId(q) }); // only add when valid
      }
      match.$or = ors;
    }

    const [total, rowsRaw] = await Promise.all([
      col.countDocuments(match),
      col
        .find(match, { projection: { "receipt.data": 0 } }) // don't send buffer
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .toArray(),
    ]);

    const rows = rowsRaw.map((r) => ({
      ...r,
      _id: String(r._id),
      id: String(r._id),
      receipt: r.receipt
        ? {
            filename: r.receipt.filename,
            mimetype: r.receipt.mimetype,
            size: r.receipt.size,
            path: `/api/expenses/${encodeURIComponent(String(r._id))}/files/receipt`,
          }
        : null,
    }));

    return NextResponse.json({ total, page, perPage, rows });
  } catch (e) {
    console.error("GET /api/expenses/list error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
