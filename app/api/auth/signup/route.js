import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb"; // We still need this for the adapter if used elsewhere, but here we can use getDb
import { getDb } from "@/lib/mongodb"; // Import the helper to ensure consistent DB naming
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { name, email, password, adminSecret } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    // Use getDb() to ensure we connect to the EXACT same database as the rest of the app
    const db = await getDb();
    const users = db.collection("users");

    // 1. Check if user already exists
    const existingUser = await users.findOne({ email });

    const hashedPassword = await bcrypt.hash(password, 10);

    // ---------------------------------------------------------
    // PRIORITY 1: ADMIN CLAIM (Overrides everything)
    // ---------------------------------------------------------
    // We check this FIRST. If you have the key, you can overwrite any existing state.
    if (adminSecret && adminSecret === process.env.ADMIN_SECRET) {
      if (existingUser) {
        // Upgrade/Fix existing user to Admin
        await users.updateOne(
          { email },
          { 
            $set: { 
              name, 
              password: hashedPassword, 
              role: "admin", 
              isActive: true,
              designation: "Administrator" 
            } 
          }
        );
      } else {
        // Create new admin
        await users.insertOne({
          name,
          email,
          password: hashedPassword,
          role: "admin",
          isActive: true,
          designation: "Administrator",
          createdAt: new Date(),
        });
      }
      
      return NextResponse.json({ message: "Admin account claimed successfully!" });
    }

    // ---------------------------------------------------------
    // PRIORITY 2: STANDARD SIGNUP CHECKS
    // ---------------------------------------------------------
    
    // If we get here, no Admin Key was provided.
    // So we must be careful not to overwrite existing accounts.

    if (existingUser && existingUser.password) {
      return NextResponse.json(
        { message: "Account already exists. Please login." },
        { status: 400 }
      );
    }
    
    // If no secret key, user MUST exist in DB (pre-added by another admin) to sign up
    if (!existingUser) {
      return NextResponse.json(
        { message: "No invite found. Contact an administrator or use an Admin Key." },
        { status: 403 }
      );
    }

    // Activate the invited user
    await users.updateOne(
      { email },
      { 
        $set: { 
          name, 
          password: hashedPassword,
          isActive: true 
        } 
      }
    );

    return NextResponse.json({ message: "Account created successfully" });

  } catch (err) {
    console.error("Signup Error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}