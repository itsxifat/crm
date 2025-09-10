import User from "@/models/User";
import connectDB from "@/utils/connectDB";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = "your_jwt_secret";

export async function GET(req) {
  await connectDB();
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ message: "Not authorized" }, { status: 401 });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    return NextResponse.json({ user: { name: user.name, email: user.email } });
  } catch {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }
}
