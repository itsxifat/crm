// app/api/clients/add/route.js
import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongoose";
import Client from "@/models/Client";

export async function POST(req) {
  try {
    await connectMongoose();
    const form = await req.formData();

    const doc = {
      companyName:  form.get("companyName") || null,
      clientName:   form.get("clientName"),
      email:        form.get("email"),
      phone:        form.get("phone"),
      website:      form.get("website") || null,
      pageLink:     form.get("pageLink") || null,
      joiningDate:  form.get("joiningDate") ? new Date(form.get("joiningDate")) : null,
      priority:     form.get("priority") || "Normal",
      address: {
        line1:      form.get("address.line1") || null,
        line2:      form.get("address.line2") || null,
        city:       form.get("address.city") || null,
        state:      form.get("address.state") || null,
        postalCode: form.get("address.postalCode") || null,
        country:    form.get("address.country") || null,
      },
    };

    const nidFile = form.get("nidFile");
    if (nidFile && typeof nidFile === "object" && nidFile.size > 0 && nidFile.arrayBuffer) {
      const buffer = Buffer.from(await nidFile.arrayBuffer());
      doc.nidFile = {
        filename: nidFile.name,
        mimetype: nidFile.type || "application/octet-stream",
        size: nidFile.size,
        data: buffer,
      };
    }

    const tradeFile = form.get("tradeLicenseFile");
    if (tradeFile && typeof tradeFile === "object" && tradeFile.size > 0 && tradeFile.arrayBuffer) {
      const buffer = Buffer.from(await tradeFile.arrayBuffer());
      doc.tradeLicenseFile = {
        filename: tradeFile.name,
        mimetype: tradeFile.type || "application/octet-stream",
        size: tradeFile.size,
        data: buffer,
      };
    }

    const client = await Client.create(doc);
    return NextResponse.json({ id: client._id.toString() }, { status: 201 });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Upload failed", details: err.message },
      { status: 500 }
    );
  }
}
