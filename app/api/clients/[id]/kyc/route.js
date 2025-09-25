import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import mongoose from "mongoose";
import Client from "@/models/Client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_req, { params }) {
  const { id } = await params; // Next 15

  try {
    await connectMongoose();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    // Only metadata fields, never .data
    const doc = await Client.findById(id)
      .select(
        [
          "nidFile.filename",
          "nidFile.mimetype",
          "nidFile.size",
          "nidFile.uploadedAt",
          "tradeLicenseFile.filename",
          "tradeLicenseFile.mimetype",
          "tradeLicenseFile.size",
          "tradeLicenseFile.uploadedAt",
        ].join(" ")
      )
      .lean();

    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const build = (f, fieldName) =>
      f
        ? {
            filename: f.filename || "",
            mimetype: f.mimetype || "",
            size: f.size || 0,
            uploadedAt: f.uploadedAt || null,
            path: `/api/clients/${encodeURIComponent(id)}/files/${fieldName}`,
          }
        : null;

    return NextResponse.json({
      nidFile: build(doc.nidFile, "nidFile"),
      tradeLicenseFile: build(doc.tradeLicenseFile, "tradeLicenseFile"),
    });
  } catch (e) {
    console.error("KYC GET error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
