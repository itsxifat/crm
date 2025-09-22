// app/api/clients/[id]/files/[field]/route.js
import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import mongoose from "mongoose";
import Client from "@/models/Client";

export async function GET(req, { params }) {
  const { id, field } = await params;

  try {
    await connectMongoose();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid client id" }, { status: 400 });
    }

    const client = await Client.findById(id);
    if (!client || !client[field] || !client[field].data) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const file = client[field];
    const binary = Buffer.isBuffer(file.data)
      ? file.data
      : Buffer.from(file.data);

    return new NextResponse(binary, {
      headers: {
        "Content-Type": file.mimetype,
        "Content-Disposition": `inline; filename="${file.filename}"`,
        "Content-Length": file.size.toString(),
      },
    });
  } catch (err) {
    console.error("File streaming error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
