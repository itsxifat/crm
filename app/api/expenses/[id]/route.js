// app/api/expenses/[id]/route.js
import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import Expense from "@/models/Expense";
import mongoose from "mongoose";
import { requireAdmin, handleAuthError } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function parseBody(req) {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("multipart/form-data")) {
    const form = await req.formData();
    const get = (k) => (form.get(k) ?? "").toString();
    const getNum = (k) => Number(get(k)) || 0;

    const file = form.get("receipt");
    let receipt = undefined; // undefined = don't touch, null = remove, object = replace
    if (file === "null" || file === "remove") {
      receipt = null;
    } else if (file && typeof file === "object" && "arrayBuffer" in file) {
      const buf = Buffer.from(await file.arrayBuffer());
      receipt = {
        filename: file.name || "receipt.bin",
        mimetype: file.type || "application/octet-stream",
        size: buf.length,
        data: buf,
      };
    }

    const whoSpentStr = get("whoSpent");
    const whoSpent = mongoose.Types.ObjectId.isValid(whoSpentStr)
      ? new mongoose.Types.ObjectId(whoSpentStr)
      : undefined; // undefined = don't patch, null to clear

    const patch = {
      ...(get("title") ? { title: get("title") } : {}),
      ...(form.has("amount") ? { amount: getNum("amount") } : {}),
      ...(form.has("details") ? { details: get("details") } : {}),
      ...(form.has("whereSpent") ? { whereSpent: get("whereSpent") } : {}),
      ...(form.has("paymentMethod") ? { paymentMethod: get("paymentMethod") || "others" } : {}),
      ...(form.has("accountNumber") ? { accountNumber: get("accountNumber") } : {}),
      ...(form.has("date") ? { date: get("date") ? new Date(get("date")) : null } : {}),
      ...(form.has("projectEnvId") ? { projectEnvId: get("projectEnvId") } : {}),
      ...(form.has("projectServiceKey") ? { projectServiceKey: get("projectServiceKey") } : {}),
      ...(form.has("sisterConcern") ? { sisterConcern: get("sisterConcern") } : {}),
      ...(form.has("autoFrom") ? { autoFrom: get("autoFrom") } : {}),
      ...(form.has("whoSpent") ? { whoSpent: whoSpent ?? null } : {}),
    };

    if (receipt !== undefined) patch.receipt = receipt;
    return patch;
  }

  return await req.json();
}

export async function GET(_req, { params }) {
  try {
    await requireAdmin();
    await connectMongoose();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const doc = await Expense.findById(id).lean();
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // do not send receipt.data in metadata endpoint
    const { receipt, ...rest } = doc;
    return NextResponse.json({
      ...rest,
      _id: String(doc._id),
      receipt: receipt
        ? {
            filename: receipt.filename,
            mimetype: receipt.mimetype,
            size: receipt.size,
            path: `/api/expenses/${id}/receipt`,
          }
        : null,
    });
  } catch(e) {
    if (e?.status === 401 || e?.status === 403) return handleAuthError(e);
    console.error("expenses GET [id] error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  await connectMongoose();
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    await requireAdmin();
    const patch = await parseBody(req);
    patch.updatedAt = new Date();

    await Expense.updateOne({ _id: id }, { $set: patch });
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e?.status === 401 || e?.status === 403) return handleAuthError(e);
    console.error("expenses PATCH error:", e);
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  await connectMongoose();
  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    await requireAdmin();
    await Expense.deleteOne({ _id: id });
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e?.status === 401 || e?.status === 403) return handleAuthError(e);
    console.error("expenses DELETE error:", e);
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}