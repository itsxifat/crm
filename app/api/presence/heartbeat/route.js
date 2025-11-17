// app/api/presence/heartbeat/route.js
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { requireAdmin, handleAuthError } from "@/lib/requireAdmin";
import { authOptions } from "@/lib/authOptions"; // This is used by requireAdmin

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // Use requireAdmin which returns the user object on success
    const user = await requireAdmin();

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "en_crm");

    // Mark the user online and bump lastSeen on heartbeat
    await db.collection("users").updateOne(
      { email: user.email }, // Use email from validated user
      {
        $set: {
          isActive: true,
          lastSeen: new Date(),
        },
      }
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e?.status === 401 || e?.status === 403) return handleAuthError(e);
    console.error("presence heartbeat error:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}