import User from "@/models/User";
import { connectMongoose } from "@/lib/mongoose"; // <-- 1. Import the correct Mongoose connector
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your_jwt_secret"; // Use env variable if available

export async function GET(req) {
  await connectMongoose(); // <-- 2. Call the Mongoose connection function
  
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ message: "Not authorized" }, { status: 401 });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: { name: user.name, email: user.email } });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }
}