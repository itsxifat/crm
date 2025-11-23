import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import Lead from "@/models/Lead";
import { requireAdmin, handleAuthError } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  
  // Normalize headers: trim, lowercase, remove extra spaces
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, ' '));
  
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    // Simple CSV parser (handles quoted values basic case)
    // For robust parsing, a library like 'csv-parse' is better, but this works for standard exports
    const cells = [];
    let current = '';
    let inQuote = false;
    
    for (let char of lines[i]) {
      if (char === '"') {
        inQuote = !inQuote;
      } else if (char === ',' && !inQuote) {
        cells.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    cells.push(current.trim());

    if (cells.every((c) => c === "")) continue;
    
    const row = {};
    headers.forEach((h, idx) => {
      // Clean quotes from values
      let val = cells[idx] || "";
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      }
      row[h] = val;
    });
    rows.push(row);
  }
  return rows;
}

// Helper to find value from multiple potential header names
const getVal = (row, ...keys) => {
  for (const k of keys) {
    if (row[k]) return row[k];
  }
  return undefined;
};

const parseDate = (d) => {
  if (!d) return undefined;
  const date = new Date(d);
  return isNaN(date.getTime()) ? undefined : date;
};

export async function POST(req) {
  try {
    await requireAdmin();
    await connectMongoose();
    const form = await req.formData();
    const file = form.get("file");
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const text = await file.text();
    const raw = parseCsv(text);

    const docs = raw
      .map((r) => ({
        name: getVal(r, 'name', 'full name'),
        phone: getVal(r, 'phone', 'mobile', 'contact'),
        email: getVal(r, 'email', 'e-mail'),
        company: getVal(r, 'company', 'company name'),
        status: getVal(r, 'status') || "New Lead",
        
        // New Fields Mappings based on your CSV
        source: getVal(r, 'source'),
        date: parseDate(getVal(r, 'date')),
        sendingDate: parseDate(getVal(r, 'sending date', 'sending_date')),
        note: getVal(r, 'note', 'notes'),
        reference: getVal(r, 'reference', 'ref'),
        category: getVal(r, 'category'),
        service: getVal(r, 'service', 'interested service', 'interested_service'), // Handles "Interested Service"
        fbPageLink: getVal(r, 'fb page link', 'fb pagelink', 'fb_link', 'facebook link'),
        platform: getVal(r, 'through whom or which platform', 'through', 'platform'),
        followupDate: parseDate(getVal(r, 'followup', 'followup date', 'follow_up')),
        location: getVal(r, 'location', 'address')
      }))
      .filter((d) => d.name); // Required field

    if (docs.length === 0) return NextResponse.json({ inserted: 0 }, { status: 200 });

    const result = await Lead.insertMany(docs, { ordered: false });
    return NextResponse.json({ inserted: result.length }, { status: 201 });
  } catch (e) {
    if (e?.status === 401 || e?.status === 403) return handleAuthError(e);
    console.error("leads/upload POST error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}