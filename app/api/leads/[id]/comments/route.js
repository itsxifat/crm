import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import Lead from "@/models/Lead";
import { requireAdmin, handleAuthError } from "@/lib/requireAdmin";

export async function POST(req, { params }) {
  try {
    const user = await requireAdmin(); // Get logged-in user
    await connectMongoose();
    
    const { id } = await params;
    const body = await req.json();

    if (!body.text) {
      return NextResponse.json({ error: "Comment text required" }, { status: 400 });
    }

    const comment = {
      text: body.text,
      author: user.name || user.email || "Admin", // Automatically set author
      createdAt: new Date(),
    };

    const updatedLead = await Lead.findByIdAndUpdate(
      id,
      { $push: { comments: comment } },
      { new: true }
    );

    if (!updatedLead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(updatedLead.comments, { status: 201 });
  } catch (e) {
    if (e?.status === 401 || e?.status === 403) return handleAuthError(e);
    console.error("Comment add error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}