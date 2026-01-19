import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import Client from "@/models/Client";
import { requireAdmin, handleAuthError } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req) {
  try {
    await requireAdmin();
    await connectMongoose();

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get("perPage") || "25", 10)));
    const skip = (page - 1) * perPage;

    // --- 1. Advanced Search Logic ---
    let match = {};
    
    if (q) {
      // Split search terms by space to allow multi-field matching
      // e.g. "John CEO" -> matches {clientName: /John/} AND {designation: /CEO/}
      const terms = q.split(/\s+/).filter(Boolean);
      
      const searchFields = [
        // Identity
        "companyName", "clientName", "designation", 
        // Contact
        "email", "phone", "alternativePhone",
        // Web
        "website", "links", 
        // Location
        "address.line1", "address.line2", "address.city", "address.state", "address.postalCode", "address.country",
        // Meta
        "priority"
      ];

      // Create an AND array: Every term must match AT LEAST ONE field
      match.$and = terms.map(term => {
        const rx = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        return {
          $or: searchFields.map(field => ({ [field]: rx }))
        };
      });
    }

    // --- 2. Smart Projection ---
    // Instead of selecting specific fields (which risks missing new ones like 'logo'), 
    // we EXCLUDE the heavy arrays. Everything else (logo, designation, etc.) is included automatically.
    const EXCLUDE_FIELDS = "-leadHistory -kycDocuments -__v";

    const totalPromise = q ? Client.countDocuments(match) : Client.estimatedDocumentCount();

    const rowsPromise = Client.find(match)
      .select(EXCLUDE_FIELDS)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(perPage)
      .lean()
      .exec();

    const [total, rows] = await Promise.all([totalPromise, rowsPromise]);

    // --- 3. Data Formatting ---
    const out = rows.map((c) => {
      return {
        ...c,
        _id: c._id.toString(), // Ensure ID is string for frontend
        id: c._id.toString(),  // Legacy support
        
        // Safety defaults for UI
        logo: c.logo || null,
        designation: c.designation || "",
        address: c.address || {},
        priority: c.priority || "Normal",
        
        // Display Name Logic
        name: (c.companyName && c.companyName.trim()) 
          ? c.companyName 
          : (c.clientName || "Unknown Client")
      };
    });

    return NextResponse.json({ 
      total, 
      page, 
      perPage, 
      rows: out 
    }, { status: 200 });

  } catch (e) {
    if (e?.status === 401 || e?.status === 403) return handleAuthError(e);
    console.error("clients/list GET error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}