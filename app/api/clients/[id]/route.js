import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import mongoose from "mongoose";
import Client from "@/models/Client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_req, { params }) {
  const { id } = await params; // Next 15: await params

  try {
    await connectMongoose();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    // Select only what the page needs (no file buffers)
    const PROJECTION = [
      "companyName",
      "clientName",
      "email",
      "phone",
      "website",
      "pageLink",
      "priority",
      "address",
      "createdAt",
      "updatedAt",
      // only to compute presence flags
      "nidFile.filename",
      "tradeLicenseFile.filename",
    ].join(" ");

    const doc = await Client.findById(id).select(PROJECTION).lean();
    if (!doc) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        id: String(doc._id),
        _id: String(doc._id),

        companyName: doc.companyName ?? "",
        clientName:  doc.clientName  ?? "",
        email:       doc.email       ?? "",
        phone:       doc.phone       ?? "",
        website:     doc.website     ?? "",
        pageLink:    doc.pageLink    ?? "",

        priority: doc.priority ?? "Normal",
        address:  doc.address  ?? null,

        createdAt: doc.createdAt ?? null,
        updatedAt: doc.updatedAt ?? null,

        hasNidFile: !!doc?.nidFile?.filename,
        hasTradeLicenseFile: !!doc?.tradeLicenseFile?.filename,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Client fetch error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
