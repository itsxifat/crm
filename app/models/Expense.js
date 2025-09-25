// models/Expense.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const FileEmbedSchema = new Schema(
  {
    filename: String,
    mimetype: String,
    size: Number,
    data: Buffer,
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ExpenseSchema = new Schema(
  {
    // required core
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },

    // optional metadata
    details: { type: String },
    whereSpent: { type: String },
    whoSpent: { type: Schema.Types.ObjectId, ref: "User", default: null },

    paymentMethod: {
      type: String,
      enum: ["bkash", "bank", "nagad", "roket", "card", "cash", "others", "internal"],
      default: "others",
    },
    accountNumber: { type: String },

    date: { type: Date, default: Date.now },

    // project linkage
    projectId: { type: Schema.Types.ObjectId, ref: "Project", default: null },
    projectEnvId: { type: String, default: "" }, // your human id (e.g., PRJ-2025-....)
    projectServiceKey: { type: String, default: "" }, // deterministic key per service row
    sisterConcern: { type: String, default: "" }, // copy from project if present

    // mark auto-created rows from project services
    autoFrom: { type: String, default: "" }, // "project" for auto rows

    // receipt (buffer)
    receipt: { type: FileEmbedSchema, default: null },
  },
  { timestamps: true }
);

// helpful indexes
ExpenseSchema.index({ projectId: 1 });
ExpenseSchema.index({ projectEnvId: 1 });
ExpenseSchema.index({ projectServiceKey: 1 }, { unique: false });
ExpenseSchema.index({ title: "text", details: "text" });

export default mongoose.models.Expense || mongoose.model("Expense", ExpenseSchema);
