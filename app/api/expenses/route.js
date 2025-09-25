// app/api/expenses/route.js
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const toOID = (v) => {
  try {
    if (!v) return null;
    const s = String(v);
    return ObjectId.isValid(s) ? new ObjectId(s) : null;
  } catch {
    return null;
  }
};

export async function POST(req) {
  try {
    const db = await getDb();

    // Accept multipart form-data
    const fd = await req.formData();

    const title = (fd.get("title") || "").toString().trim();
    const details = (fd.get("details") || "").toString().trim();
    const whereSpent = (fd.get("whereSpent") || "").toString().trim();
    const paymentMethod = (fd.get("paymentMethod") || "").toString().trim() || "Cash";
    const accountNumber = (fd.get("accountNumber") || "").toString().trim();

    const amount = Number(fd.get("amount") || 0);
    const dateStr = (fd.get("date") || "").toString();
    const date = dateStr ? new Date(dateStr) : new Date();

    const whoSpentUserId = (fd.get("whoSpentUserId") || "").toString().trim();
    const projectIdInput = (fd.get("projectId") || "").toString().trim();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!(amount > 0)) {
      return NextResponse.json({ error: "Amount must be > 0" }, { status: 400 });
    }
    if (!whoSpentUserId) {
      return NextResponse.json({ error: "whoSpentUserId is required" }, { status: 400 });
    }

    // Try to resolve user & project for denormalized fields
    const usersCol = db.collection("users");
    const projectsCol = db.collection("projects");

    const userOID = toOID(whoSpentUserId);
    const userDoc = userOID
      ? await usersCol.findOne({ _id: userOID }, { projection: { name: 1, email: 1 } })
      : await usersCol.findOne({ id: whoSpentUserId }, { projection: { name: 1, email: 1 } });

    const whoSpentName = userDoc?.name || userDoc?.email || "";

    // Projects may store either env `id` (string) or `_id`(ObjectId)
    let projectDoc = null;
    if (projectIdInput) {
      const projOID = toOID(projectIdInput);
      if (projOID) {
        projectDoc = await projectsCol.findOne({ _id: projOID }, { projection: { id: 1, name: 1 } });
      }
      if (!projectDoc) {
        projectDoc = await projectsCol.findOne({ id: projectIdInput }, { projection: { id: 1, name: 1 } });
      }
    }

    const projectId = projectDoc?.id || (projectDoc?._id ? String(projectDoc._id) : projectIdInput) || "";
    const projectOID = projectDoc?._id || null;
    const projectName = projectDoc?.name || "";

    // Handle optional receipt file
    let receipt = null;
    const file = fd.get("receipt");
    if (file && typeof file === "object" && "arrayBuffer" in file) {
      const ab = await file.arrayBuffer();
      const buf = Buffer.from(ab);
      receipt = {
        filename: file.name || "receipt",
        mimetype: file.type || "application/octet-stream",
        size: buf.length,
        data: buf,
        uploadedAt: new Date(),
      };
    }

    const doc = {
      title,
      details,
      amount,
      whereSpent,
      paymentMethod,
      accountNumber,
      date,
      whoSpentUserId: userOID || whoSpentUserId, // store OID if valid, else raw string
      whoSpentName,
      projectId,            // keep the external/env id (string) for quick display
      projectOID,           // store ObjectId when resolvable
      projectName,
      ...(receipt ? { receipt } : {}),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const { insertedId } = await db.collection("expenses").insertOne(doc);
    return NextResponse.json({ success: true, id: String(insertedId), _id: String(insertedId) }, { status: 201 });
  } catch (e) {
    console.error("POST /api/expenses error:", e);
    return NextResponse.json({ error: "Failed to save expense" }, { status: 500 });
  }
}

// Optional: simple GET fallback so your page can also call /api/expenses?q=...
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();

    const db = await getDb();
    const expensesCol = db.collection("expenses");

    const match = {};
    if (q) {
      match.$or = [
        { title: { $regex: q, $options: "i" } },
        { details: { $regex: q, $options: "i" } },
        { projectId: { $regex: q, $options: "i" } },
        { projectName: { $regex: q, $options: "i" } },
        { whoSpentName: { $regex: q, $options: "i" } },
        { whereSpent: { $regex: q, $options: "i" } },
        // allow searching by _id hex
        { _id: ObjectId.isValid(q) ? new ObjectId(q) : undefined },
      ].filter(Boolean);
    }

    const rows = await expensesCol
      .find(match, {
        projection: {
          // never send buffer in list
          "receipt.data": 0,
        },
      })
      .sort({ date: -1, createdAt: -1 })
      .limit(500)
      .toArray();

    // normalize id fields for the UI
    const out = rows.map((r) => ({
      ...r,
      _id: String(r._id),
      id: String(r._id),
      // keep receipt meta but no data
      receipt: r.receipt
        ? {
            filename: r.receipt.filename,
            mimetype: r.receipt.mimetype,
            size: r.receipt.size,
            path: `/api/expenses/${encodeURIComponent(String(r._id))}/files/receipt`,
          }
        : null,
    }));

    // Return an array for the fallback; your page already copes with this
    return NextResponse.json(out);
  } catch (e) {
    console.error("GET /api/expenses error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
