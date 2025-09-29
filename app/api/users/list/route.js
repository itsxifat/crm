// app/api/users/list/route.js
import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { requireAdmin, handleAuthError } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await requireAdmin(); // ⟵ blocks non-admin

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "en_crm");
    const users = await db.collection("users")
      .find({}, { projection: { password: 0 } }) // never leak passwords
      .toArray();

    return NextResponse.json(users, { status: 200 });
  } catch (e) {
    if (e?.status === 401 || e?.status === 403) return handleAuthError(e);
    console.error("users/list GET error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
