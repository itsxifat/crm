// app/api/clients/[id]/route.js
import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import mongoose from "mongoose";
import Client from "@/models/Client";
import { absoluteUrl } from "@/lib/absoluteUrl";

export async function GET(req, { params }) {
  const { id } = await params;   // ✅ FIX: await params

  try {
    await connectMongoose();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const client = await Client.findById(id).lean();
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...client,
      id: client._id.toString(),

      nidFile: client.nidFile
        ? {
            filename: client.nidFile.filename,
            mimetype: client.nidFile.mimetype,
            size: client.nidFile.size,
            path: await absoluteUrl(`/api/clients/${id}/files/nidFile`), // ✅
          }
        : null,

      tradeLicenseFile: client.tradeLicenseFile
        ? {
            filename: client.tradeLicenseFile.filename,
            mimetype: client.tradeLicenseFile.mimetype,
            size: client.tradeLicenseFile.size,
            path: await absoluteUrl(`/api/clients/${id}/files/tradeLicenseFile`), // ✅
          }
        : null,
    });
  } catch (err) {
    console.error("Client fetch error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
