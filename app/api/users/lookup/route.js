// app/api/users/lookup/route.js
import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { requireAdmin, handleAuthError } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req) {
  try {
    await requireAdmin();

    const url = new URL(req.url);
    const idsParam = (url.searchParams.get("ids") || "").trim();
    if (!idsParam) return NextResponse.json({ users: [] }, { status: 200 });

    const rawIds = idsParam.split(",").map(s => s.trim()).filter(Boolean);
    if (rawIds.length === 0) return NextResponse.json({ users: [] }, { status: 200 });

    const ids = rawIds.map(id => (ObjectId.isValid(id) ? new ObjectId(id) : id));

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "en_crm");
    const rows = await db.collection("users")
      .find({ _id: { $in: ids } }, { projection: { password: 0 } })
      .toArray();

    const users = rows.map(u => ({
      _id: String(u._id),
      id: String(u._id),
      name: u.name || u.fullName || u.email || String(u._id),
      email: u.email || "",
      avatarUrl: u.avatarUrl || ""
    }));

    return NextResponse.json({ users }, { status: 200 });
  } catch (e) {
    if (e?.status === 401 || e?.status === 403) return handleAuthError(e);
    console.error("users/lookup GET error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
