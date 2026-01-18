import mongoose from "mongoose";

// Reuse comment schema to preserve history
const CommentSchema = new mongoose.Schema({
  text: String,
  author: String,
  createdAt: Date,
}, { _id: false });

const ClientSchema = new mongoose.Schema(
  {
    // Identity
    clientName: { type: String, required: true }, // Contact Person
    companyName: { type: String, required: true },
    designation: { type: String }, // NEW
    logo: { type: String }, // NEW: URL to image
    
    // Contact
    email: { type: String },
    phone: { type: String },
    alternativePhone: { type: String }, // NEW
    
    // Web Presence
    website: { type: String },
    links: { type: [String], default: [] }, // NEW: Social links array
    
    // Location
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },

    // Business Logic
    priority: { type: String, default: "Normal" },
    joiningDate: { type: Date, default: Date.now },
    
    // Lead History Preservation
    convertedFrom: { type: mongoose.Schema.Types.ObjectId, ref: "Lead" },
    leadHistory: { type: [CommentSchema], default: [] }, // Preserved comments
    
    // KYC
    kycDocuments: [{ name: String, url: String, uploadedAt: Date }],
  },
  { timestamps: true }
);

export default mongoose.models.Client || mongoose.model("Client", ClientSchema);