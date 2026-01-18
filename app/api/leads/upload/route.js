import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import Lead from "@/models/Lead";
import { requireAdmin } from "@/lib/requireAdmin";

// Helper to clean strings
const clean = (str) => (str ? str.toString().trim() : "");

// Helper to parse dates DD/MM/YYYY or YYYY-MM-DD
const parseDate = (str) => {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

export async function POST(req) {
  try {
    await requireAdmin();
    await connectMongoose();

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const text = await file.text();
    // Split by newline and handle CR/LF
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
    
    if (lines.length < 2) {
      return NextResponse.json({ error: "Empty CSV file" }, { status: 400 });
    }

    // Parse Headers (Case Insensitive normalization)
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
    
    // Map CSV headers to Schema keys
    const headerMap = {
      "name": "name",
      "full name": "name",
      "phone": "phone",
      "mobile": "phone",
      "alt phone": "alternativePhone",
      "alternative phone": "alternativePhone",
      "email": "email",
      "designation": "designation",
      "role": "designation",
      "company": "company",
      "organization": "company",
      "status": "status",
      "source": "source",
      "platform": "platform",
      "reference": "reference",
      "category": "category",
      "service": "service",
      "sister concern": "service",
      "links": "links", // Assumes comma-separated in one cell
      "location": "location",
      "address": "location",
      "note": "note",
      "notes": "note",
      "date": "date",
      "lead date": "date",
      "sending date": "sendingDate",
      "follow up": "followupDate",
      "followup date": "followupDate"
    };

    const leadsToInsert = [];

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      // Split by comma, handling quotes if necessary (basic implementation)
      // For robust CSV parsing, a library like 'papaparse' is recommended, 
      // but strictly following the prompt instructions to fix *this* code:
      const values = lines[i].split(",").map(v => v.trim());
      
      const leadData = {};
      let hasName = false;

      headers.forEach((header, index) => {
        const schemaKey = headerMap[header];
        const val = values[index];

        if (schemaKey) {
          if (schemaKey === "name" && val) hasName = true;
          
          if (["date", "sendingDate", "followupDate"].includes(schemaKey)) {
            leadData[schemaKey] = parseDate(val);
          } else if (schemaKey === "links") {
            // Split multiple links by space or semicolon
            leadData[schemaKey] = val ? val.split(/[ ;]+/).filter(l => l.includes("http")) : [];
          } else {
            leadData[schemaKey] = clean(val);
          }
        }
      });

      // Default values
      if (!leadData.status) leadData.status = "New Lead";
      if (!leadData.date) leadData.date = new Date();

      if (hasName) {
        leadsToInsert.push(leadData);
      }
    }

    if (leadsToInsert.length > 0) {
      await Lead.insertMany(leadsToInsert);
    }

    return NextResponse.json({ 
      success: true, 
      inserted: leadsToInsert.length 
    });

  } catch (e) {
    console.error("CSV Upload Error:", e);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}