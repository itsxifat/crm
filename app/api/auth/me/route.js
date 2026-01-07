import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions"; // Use your centralized options
import { connectMongoose } from "@/lib/mongoose";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Connect to DB (Standard Mongoose connection)
    await connectMongoose();

    // 2. Get the session using NextAuth
    const session = await getServerSession(authOptions);

    // 3. If no session, return 401
    if (!session) {
      return NextResponse.json({ message: "Not authorized" }, { status: 401 });
    }

    // 4. (Optional) Fetch fresh user data from DB to ensure they still exist/are active
    //    This is safer than just trusting the token payload indefinitely.
    const user = await User.findOne({ email: session.user.email }).select("-password");

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // 5. Return the user info
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error in /api/auth/me:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}