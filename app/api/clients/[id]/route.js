import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import Client from "@/models/Client";
import { requireAdmin, handleAuthError } from "@/lib/requireAdmin";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// Force Node.js runtime for file system access
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// --- Helper: Save File ---
async function saveFile(file) {
  if (!file || typeof file !== "object") return null;
  
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  const filename = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  
  try {
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);
    return `/uploads/${filename}`;
  } catch (error) {
    console.error("File save error:", error);
    throw new Error("Failed to save file to disk");
  }
}

// --- GET: Fetch Single Client ---
export async function GET(req, { params }) {
  try {
    await requireAdmin();
    await connectMongoose();
    const { id } = await params;
    const client = await Client.findById(id).lean();
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
    return NextResponse.json(client);
  } catch (e) {
    if (e?.status === 401) return handleAuthError(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// --- PATCH: Update Client (Smart Handler) ---
export async function PATCH(req, { params }) {
  try {
    await requireAdmin();
    await connectMongoose();
    
    const { id } = await params;
    const contentType = req.headers.get("content-type") || "";
    
    let updateOperation = {};

    // 1. Handle Multipart Form Data (Files + Text)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();

      // CASE A: KYC Document Upload (Identified by 'file' field)
      if (formData.has("file")) {
        const file = formData.get("file");
        const name = formData.get("name") || file.name;
        const url = await saveFile(file);
        
        updateOperation = {
          $push: { 
            kycDocuments: { name, url, uploadedAt: new Date() } 
          }
        };
      } 
      // CASE B: Profile Update (Identified by absence of 'file', typically has 'clientName' etc)
      else {
        const data = {};
        
        // Manual Field Extraction
        const fields = ["clientName", "companyName", "designation", "email", "phone", "alternativePhone", "website", "priority", "joiningDate"];
        fields.forEach(f => {
           if (formData.has(f)) data[f] = formData.get(f);
        });

        // Handle Logo
        if (formData.has("logo")) {
           const logoFile = formData.get("logo");
           if (logoFile && typeof logoFile === 'object' && logoFile.size > 0) {
              data.logo = await saveFile(logoFile);
           }
        }

        // Handle Links (JSON String)
        if (formData.has("links")) {
           try {
             data.links = JSON.parse(formData.get("links"));
           } catch (e) { data.links = []; }
        }

        // Handle Address (Nested keys need flattening for Mongo if partial update, 
        // but here we usually send specific keys. Let's map dotted keys.)
        if (formData.has("address.line1")) data["address.line1"] = formData.get("address.line1");
        if (formData.has("address.line2")) data["address.line2"] = formData.get("address.line2");
        if (formData.has("address.city")) data["address.city"] = formData.get("address.city");
        if (formData.has("address.state")) data["address.state"] = formData.get("address.state");
        if (formData.has("address.postalCode")) data["address.postalCode"] = formData.get("address.postalCode");
        if (formData.has("address.country")) data["address.country"] = formData.get("address.country");

        updateOperation = { $set: data };
      }
    } 
    // 2. Handle Standard JSON Update (Raw Text Body)
    else {
      const body = await req.json();
      updateOperation = { $set: body };
    }

    // Perform Update
    const updatedClient = await Client.findByIdAndUpdate(id, updateOperation, { new: true });

    if (!updatedClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(updatedClient);

  } catch (e) {
    console.error("PATCH Client Error:", e);
    if (e?.status === 401) return handleAuthError(e);
    return NextResponse.json({ error: e.message || "Update failed" }, { status: 500 });
  }
}

// --- DELETE: Remove Client or Sub-document ---
export async function DELETE(req, { params }) {
  try {
    await requireAdmin();
    await connectMongoose();
    
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const docId = searchParams.get("docId");

    if (docId) {
      // Remove specific KYC doc
      const updated = await Client.findByIdAndUpdate(
        id,
        { $pull: { kycDocuments: { _id: docId } } },
        { new: true }
      );
      return NextResponse.json(updated || { error: "Not found" });
    }

    // Delete Client
    await Client.findByIdAndDelete(id);
    return NextResponse.json({ success: true });

  } catch (e) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}