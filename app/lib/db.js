import clientPromise from "./mongodb";

export async function getCollection(collectionName) {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB); // Fixed: Use env var
  return db.collection(collectionName);
}