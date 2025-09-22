// app/api/presence/offline/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { authOptions } from "@/lib/authOptions"; // ✅ FIXED import

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "en_crm");

    // Mark user offline immediately
    await db.collection("users").updateOne(
      { email: session.user.email },
      {
        $set: {
          isActive: false,
          lastSeen: new Date(), // track when they left
        },
      }
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("presence offline error:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
