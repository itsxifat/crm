import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import Client from "@/models/Client";
import Lead from "@/models/Lead";
import { requireAdmin } from "@/lib/requireAdmin";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// Support file uploads
export const runtime = "nodejs";

// Helper: Save File
async function saveFile(file) {
  if (!file || typeof file !== "object") return null;
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filename = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);
  return `/uploads/${filename}`;
}

export async function POST(req) {
  try {
    await requireAdmin();
    await connectMongoose();

    const formData = await req.formData();
    const leadId = formData.get("leadId");

    if (!leadId) {
      return NextResponse.json({ error: "Lead ID is required" }, { status: 400 });
    }

    // 1. Process Files
    const logoUrl = await saveFile(formData.get("logo"));
    const nidUrl = await saveFile(formData.get("nidFile"));
    const tradeUrl = await saveFile(formData.get("tradeLicenseFile"));

    // 2. Prepare KYC Array
    const kycDocuments = [];
    if (nidUrl) kycDocuments.push({ name: "National ID", url: nidUrl, uploadedAt: new Date() });
    if (tradeUrl) kycDocuments.push({ name: "Trade License", url: tradeUrl, uploadedAt: new Date() });

    // 3. Parse Address
    const address = {
      line1: formData.get("address.line1"),
      line2: formData.get("address.line2"),
      city: formData.get("address.city"),
      state: formData.get("address.state"),
      postalCode: formData.get("address.postalCode"),
      country: formData.get("address.country"),
    };

    // 4. Parse Links
    let links = [];
    try {
      links = JSON.parse(formData.get("links") || "[]");
    } catch (e) { links = []; }

    // 5. Create Client Object
    const newClient = await Client.create({
      clientName: formData.get("clientName"),
      companyName: formData.get("companyName"),
      designation: formData.get("designation"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      alternativePhone: formData.get("alternativePhone"),
      website: formData.get("website"),
      priority: formData.get("priority") || "Normal",
      address: address,
      links: links,
      logo: logoUrl,
      kycDocuments: kycDocuments,
      
      // Link back to Lead
      convertedFrom: leadId,
      joiningDate: new Date(),
    });

    // 6. Update Lead Status
    await Lead.findByIdAndUpdate(leadId, {
      status: "Closed - Won",
      isConverted: true,
      convertedClient: newClient._id
    });

    return NextResponse.json({ 
      success: true, 
      clientId: newClient._id,
      message: "Lead converted successfully" 
    });

  } catch (e) {
    console.error("Conversion Error:", e);
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}