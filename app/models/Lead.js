import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  author: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const LeadSchema = new mongoose.Schema(
  {
    // Core fields
    name: { type: String, required: true },
    designation: { type: String, default: "" }, // New Field
    phone: { type: String },
    alternativePhone: { type: String, default: "" }, // New Field
    email: { type: String },
    company: { type: String },
    
    status: { type: String, default: "New Lead" },
    priority: { type: String, default: "Normal" },
    
    // Details (Now dropdowns in UI)
    source: { type: String },
    platform: { type: String },
    reference: { type: String },
    
    // Dates
    date: { type: Date, default: Date.now }, // Default to now
    sendingDate: { type: Date },
    followupDate: { type: Date },
    
    note: { type: String },
    category: { type: String },
    service: { type: String }, // Sister Concern
    
    // Multiple Links
    links: { type: [String], default: [] }, // Changed from single fbPageLink
    
    location: { type: String },

    // Comments
    comments: { type: [CommentSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.Lead || mongoose.model("Lead", LeadSchema);