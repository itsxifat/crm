import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("en_crm");
    const users = db.collection("users");

    // Check if email already exists
    const existingUser = await users.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: "Email already exists" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    await users.insertOne({ name, email, password: hashedPassword });

    return NextResponse.json({ message: "User created successfully" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
