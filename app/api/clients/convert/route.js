import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import Client from "@/models/Client";
import Lead from "@/models/Lead";
import { requireAdmin } from "@/lib/requireAdmin";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// Helper to save file locally
async function saveFile(file) {
  if (!file) return null;
  
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  // Create filename
  const filename = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
  
  // Define upload directory
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  
  // FIX: Create directory if it doesn't exist to prevent ENOENT
  await mkdir(uploadDir, { recursive: true });

  // Save file
  await writeFile(path.join(uploadDir, filename), buffer);
  
  return `/uploads/${filename}`;
}

export async function POST(req) {
  try {
    await requireAdmin();
    await connectMongoose();

    const formData = await req.formData();
    const leadId = formData.get("leadId");
    
    // Fetch original Lead
    const lead = await Lead.findById(leadId);
    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    // Handle Logo Upload
    const logoFile = formData.get("logo");
    let logoUrl = "";
    // Check if it's a valid file object
    if (logoFile && typeof logoFile === 'object' && logoFile.size > 0) {
        logoUrl = await saveFile(logoFile);
    }

    // Parse JSON strings safely
    const parseJSON = (str, fallback) => {
      try { return JSON.parse(str); } catch (e) { return fallback; }
    };

    // Prepare Client Data
    const clientData = {
      clientName: formData.get("clientName") || lead.name,
      companyName: formData.get("companyName") || lead.company,
      designation: formData.get("designation") || lead.designation,
      email: formData.get("email") || lead.email,
      phone: formData.get("phone") || lead.phone,
      alternativePhone: formData.get("alternativePhone") || lead.alternativePhone,
      website: formData.get("website"),
      links: parseJSON(formData.get("links"), []),
      address: parseJSON(formData.get("address"), {}),
      
      logo: logoUrl,
      
      // Link History
      convertedFrom: lead._id,
      leadHistory: lead.comments || [], 
      joiningDate: new Date()
    };

    // Create Client
    const newClient = await Client.create(clientData);

    // Update Lead Status
    lead.status = "Closed - Won";
    await lead.save();

    return NextResponse.json({ success: true, clientId: newClient._id });

  } catch (e) {
    console.error("Conversion Error:", e);

    // --- FIX: Handle Duplicate Email Error ---
    if (e.code === 11000 && e.keyPattern?.email) {
      return NextResponse.json({ 
        error: "A client with this email address already exists." 
      }, { status: 409 }); // 409 Conflict
    }

    return NextResponse.json({ error: e.message || "Server Error" }, { status: 500 });
  }
}