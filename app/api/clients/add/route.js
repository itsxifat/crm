import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import Client from "@/models/Client";
import { requireAdmin } from "@/lib/requireAdmin";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

async function saveFile(file) {
  if (!file || typeof file === "string") return null;
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
    
    // Process Files
    const logoUrl = await saveFile(formData.get("logo"));
    const nidUrl = await saveFile(formData.get("nidFile"));
    const tradeUrl = await saveFile(formData.get("tradeLicenseFile"));

    // Prepare KYC Docs array
    const kycDocuments = [];
    if (nidUrl) kycDocuments.push({ name: "National ID", url: nidUrl, uploadedAt: new Date() });
    if (tradeUrl) kycDocuments.push({ name: "Trade License", url: tradeUrl, uploadedAt: new Date() });

    // Parse Address (Manual parsing from dotted keys)
    const address = {
      line1: formData.get("address.line1"),
      line2: formData.get("address.line2"),
      city: formData.get("address.city"),
      state: formData.get("address.state"),
      postalCode: formData.get("address.postalCode"),
      country: formData.get("address.country"),
    };

    // Parse Links
    let links = [];
    try {
      links = JSON.parse(formData.get("links") || "[]");
    } catch (e) { links = []; }

    const clientData = {
      companyName: formData.get("companyName"),
      clientName: formData.get("clientName"),
      designation: formData.get("designation"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      alternativePhone: formData.get("alternativePhone"),
      website: formData.get("website"),
      links: links,
      priority: formData.get("priority") || "Normal",
      address: address,
      logo: logoUrl,
      kycDocuments: kycDocuments,
      joiningDate: new Date(),
    };

    const newClient = await Client.create(clientData);
    return NextResponse.json({ success: true, client: newClient }, { status: 201 });

  } catch (e) {
    console.error("Add Client Error:", e);
    // Handle Duplicate Email
    if (e.code === 11000) {
      return NextResponse.json({ error: "A client with this email already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}