// models/Lead.js
import mongoose from "mongoose";

const LeadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, match: [/^\S+@\S+\.\S+$/, "Invalid email format"] },
    phone: { type: String, trim: true },
    company: { type: String, trim: true },

    priority: { type: String, enum: ["Normal", "Medium", "High"], default: "Normal" },
    status: { type: String, enum: ["New Lead", "Not Converted", "Converted"], default: "New Lead" },

    note: { type: String },
    reference: { type: String },
    category: { type: String },
    interestedService: { type: String },
    fbPageLink: { type: String },
    through: { type: String },
    followup: { type: String },
    location: { type: String },
    sendingDate: { type: Date },
  },
  { timestamps: true }
);

LeadSchema.index({ createdAt: -1 });
LeadSchema.index({ email: 1 }, { sparse: true });
LeadSchema.index({ name: "text", email: "text", phone: "text", company: "text" });

export default mongoose.models.Lead || mongoose.model("Lead", LeadSchema);
