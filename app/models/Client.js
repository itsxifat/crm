import mongoose from "mongoose";
const { Schema } = mongoose;

const FileEmbedSchema = new Schema(
  {
    filename: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const AddressSchema = new Schema(
  {
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String },
    state: { type: String },
    postalCode: { type: String },
    country: { type: String },
  },
  { _id: false }
);

const ClientSchema = new Schema(
  {
    companyName: { type: String },
    clientName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    website: { type: String },
    pageLink: { type: String },
    joiningDate: { type: Date },
    priority: { type: String, enum: ["High", "Medium", "Normal"], default: "Normal" },
    address: { type: AddressSchema, required: true },
    nidFile: { type: FileEmbedSchema, default: null },
    tradeLicenseFile: { type: FileEmbedSchema, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.Client || mongoose.model("Client", ClientSchema);
