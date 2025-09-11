import mongoose from "mongoose";

const ClientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    website: { type: String },
    pageLink: { type: String },
    joiningDate: { type: Date },
    priority: { type: String, enum: ["High", "Medium", "Normal"], default: "Normal" },
  },
  { timestamps: true }
);

export default mongoose.models.Client || mongoose.model("Client", ClientSchema);
