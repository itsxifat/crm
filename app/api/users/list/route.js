// app/api/users/list/route.js
import clientPromise from "@/lib/mongodb";

export async function GET() {
  const client = await clientPromise;
  const db = client.db("en_crm");
  const users = await db.collection("users").find({}).toArray();

  return new Response(JSON.stringify(users), {
    headers: { "Content-Type": "application/json" },
  });
}
