import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
// Default to 'en_crm' if not set in .env
const dbName = process.env.MONGODB_DB || "en_crm"; 

if (!uri) throw new Error("Missing MONGODB_URI");

const options = {
  serverSelectionTimeoutMS: 5000,
  family: 4, // Force IPv4 (Fixes localhost issues on some systems)
  // tls: true, // <--- IMPORTANT: This must be REMOVED or commented out for localhost
};

let client;
let clientPromise;

if (process.env.NODE_ENV === "development") {
  if (!globalThis._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalThis._mongoClientPromise = client.connect().catch((e) => {
      console.error("[Mongo] connect error (dev):", e?.message || e);
      throw e;
    });
  }
  clientPromise = globalThis._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect().catch((e) => {
    console.error("[Mongo] connect error (prod):", e?.message || e);
    throw e;
  });
}

export default clientPromise;

// Helper to ensure we always get the correct DB
export async function getDb() {
  const cli = await clientPromise;
  return cli.db(dbName);
}