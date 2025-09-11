import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "in-house", "remote"], default: "remote" },
    lastLogin: { type: Date, default: null },
    isActive: { type: Boolean, default: false }, // track if online
    designation: { type: String, required: true },
    monthlySalary: { type: Number }, // only if role = in-house
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
