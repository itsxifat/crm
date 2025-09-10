import clientPromise from "./mongodb";

export async function getCollection(collectionName) {
  const client = await clientPromise;
  const db = client.db("en_crm"); // choose a database name
  return db.collection(collectionName);
}
