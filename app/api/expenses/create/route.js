// app/api/expenses/create/route.js
import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import Expense from "@/models/Expense";
import mongoose from "mongoose";
import { requireAdmin, handleAuthError } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Helpers
async function parseBody(req) {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("multipart/form-data")) {
    const form = await req.formData();
    const get = (k) => (form.get(k) ?? "").toString();
    const getNum = (k) => Number(get(k)) || 0;
    const getDate = (k) => {
      const v = get(k);
      const d = v ? new Date(v) : null;
      return isNaN(d?.getTime?.()) ? null : d;
    };

    const file = form.get("receipt");
    let receipt = null;
    if (file && typeof file === "object" && "arrayBuffer" in file) {
      const buf = Buffer.from(await file.arrayBuffer());
      receipt = {
        filename: file.name || "receipt.bin",
        mimetype: file.type || "application/octet-stream",
        size: buf.length,
        data: buf,
      };
    }

    const projectIdStr = get("projectId");
    const projectId = mongoose.Types.ObjectId.isValid(projectIdStr)
      ? new mongoose.Types.ObjectId(projectIdStr)
      : null;

    const whoSpentStr = get("whoSpent");
    const whoSpent = mongoose.Types.ObjectId.isValid(whoSpentStr)
      ? new mongoose.Types.ObjectId(whoSpentStr)
      : null;

    return {
      title: get("title"),
      details: get("details"),
      amount: getNum("amount"),
      whereSpent: get("whereSpent"),
      whoSpent,
      paymentMethod: get("paymentMethod") || "others",
      accountNumber: get("accountNumber"),
      date: getDate("date") || new Date(),

      projectId,
      projectEnvId: get("projectEnvId"),
      projectServiceKey: get("projectServiceKey"),
      sisterConcern: get("sisterConcern"),

      autoFrom: get("autoFrom") || "",

      receipt,
    };
  }

  // JSON fallback
  return await req.json();
}

export async function POST(req) {
  try {
    await requireAdmin();
    await connectMongoose();
    const body = await parseBody(req);

    if (!body?.title || !(body?.amount >= 0)) {
      return NextResponse.json({ error: "title and non-negative amount are required" }, { status: 400 });
    }

    const doc = await Expense.create({
      title: String(body.title).trim(),
      amount: Number(body.amount) || 0,
      details: body.details || "",
      whereSpent: body.whereSpent || "",
      whoSpent: body.whoSpent || null,
      paymentMethod: body.paymentMethod || "others",
      accountNumber: body.accountNumber || "",
      date: body.date ? new Date(body.date) : new Date(),

      projectId: body.projectId || null,
      projectEnvId: body.projectEnvId || "",
      projectServiceKey: body.projectServiceKey || "",
      sisterConcern: body.sisterConcern || "",

      autoFrom: body.autoFrom || "",

      receipt: body.receipt || null,
    });

    return NextResponse.json({ success: true, _id: String(doc._id) }, { status: 201 });
  } catch (e) {
    if (e?.status === 401 || e?.status === 403) return handleAuthError(e);
    console.error("expenses/create error:", e);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}