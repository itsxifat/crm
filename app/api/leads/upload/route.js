// app/api/leads/upload/route.js
import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import Lead from "@/models/Lead";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(",").map((c) => c.trim());
    if (cells.every((c) => c === "")) continue;
    const row = {};
    headers.forEach((h, idx) => (row[h] = cells[idx] || ""));
    rows.push(row);
  }
  return rows;
}

export async function POST(req) {
  await connectMongoose();
  const form = await req.formData();
  const file = form.get("file");
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const text = await file.text();
  const raw = parseCsv(text);

  const docs = raw
    .map((r) => ({
      name: r.name,
      email: r.email || undefined,
      phone: r.phone || undefined,
      company: r.company || undefined,
      status: r.status || undefined, // defaults to "New Lead"
      priority: r.priority || undefined, // defaults handled by schema
    }))
    .filter((d) => d.name);

  if (docs.length === 0) return NextResponse.json({ inserted: 0 }, { status: 200 });

  const result = await Lead.insertMany(docs, { ordered: false });
  return NextResponse.json({ inserted: result.length }, { status: 201 });
}
