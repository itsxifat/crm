// models/Project.js
import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    status: { type: String, enum: ["Pending", "In progress", "Completed", "On hold", "Canceled", "Revision"], default: "Pending" },
    startDate: { type: Date },
    dueDate: { type: Date },
    totalAmount: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
    profit: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Project || mongoose.model("Project", ProjectSchema);
