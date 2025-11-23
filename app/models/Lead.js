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
    phone: { type: String },
    email: { type: String },
    company: { type: String },
    status: { type: String, default: "New Lead" },
    priority: { type: String, default: "Normal" },
    
    // Details
    source: { type: String },
    date: { type: Date },
    sendingDate: { type: Date },
    note: { type: String },
    reference: { type: String },
    category: { type: String },
    // Removed 'interested' field
    service: { type: String }, // Stores "Sister Concern"
    fbPageLink: { type: String },
    platform: { type: String },
    followupDate: { type: Date },
    location: { type: String },

    // Comments
    comments: { type: [CommentSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.models.Lead || mongoose.model("Lead", LeadSchema);