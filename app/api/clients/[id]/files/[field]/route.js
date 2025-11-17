import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import mongoose from "mongoose";
import Client from "@/models/Client";
import { requireAdmin, handleAuthError } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_req, { params }) {
  const { id, field } = await params; // Next 15

  try {
    await requireAdmin();
    await connectMongoose();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid client id" }, { status: 400 });
    }

    // Need the Buffer; don't use .lean()
    const client = await Client.findById(id);
    const fileDoc = client?.[field];

    if (!client || !fileDoc || !fileDoc.data) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const binary = Buffer.isBuffer(fileDoc.data) ? fileDoc.data : Buffer.from(fileDoc.data);
    const filename = fileDoc.filename || `${field}`;
    const mimetype = fileDoc.mimetype || "application/octet-stream";

    return new NextResponse(binary, {
      status: 200,
      headers: {
        "Content-Type": mimetype,
        "Content-Disposition": `inline; filename="${encodeURIComponent(filename)}"`,
        "Content-Length": String(fileDoc.size || binary.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    if (err?.status === 401 || err?.status === 403) return handleAuthError(err);
    console.error("File streaming error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}