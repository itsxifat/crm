import mongoose from "mongoose";

const LeadAttributeSchema = new mongoose.Schema({
  // type will be 'service' (for Sister Concerns) or 'category'
  type: { type: String, required: true, enum: ['service', 'category'] },
  name: { type: String, required: true },
}, { timestamps: true });

// Ensure we don't have duplicate names in the same category
LeadAttributeSchema.index({ type: 1, name: 1 }, { unique: true });

export default mongoose.models.LeadAttribute || mongoose.model("LeadAttribute", LeadAttributeSchema);