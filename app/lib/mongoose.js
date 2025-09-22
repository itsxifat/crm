import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || "en_crm";

if (!MONGODB_URI) throw new Error("Missing MONGODB_URI");

let cached = global._mongooseConn;
if (!cached) cached = global._mongooseConn = { conn: null, promise: null };

export async function connectMongoose() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      dbName: MONGODB_DB,   // ✅ force DB name
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    }).then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
