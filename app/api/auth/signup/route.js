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

    // Check if the email exists in DB
    const existingUser = await users.findOne({ email });

    if (existingUser) {
      if (existingUser.role !== "admin") {
        return NextResponse.json(
          { message: "You must be an admin to use this feature" },
          { status: 403 }
        );
      }

      // If it's admin and already has account
      return NextResponse.json(
        { message: "Admin already has an account" },
        { status: 400 }
      );
    }

    // If email not found in DB → block non-admins
    // (meaning, only pre-created admins can sign up)
    const preApprovedAdmin = await users.findOne({ email, role: "admin" });
    if (!preApprovedAdmin) {
      return NextResponse.json(
        { message: "You must be an admin to use this feature" },
        { status: 403 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create account for admin
    await users.updateOne(
      { email },
      { $set: { name, password: hashedPassword } }
    );

    return NextResponse.json({ message: "Admin account created successfully" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
