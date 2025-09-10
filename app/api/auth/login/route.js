import User from "@/models/User";
import bcrypt from "bcryptjs";
import connectDB from "@/utils/connectDB";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = "your_jwt_secret";

export async function POST(req) {
  await connectDB();
  const { email, password } = await req.json();
  const user = await User.findOne({ email });
  if (!user) return NextResponse.json({ message: "Invalid credentials" }, { status: 400 });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return NextResponse.json({ message: "Invalid credentials" }, { status: 400 });

  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1d" });
  const res = NextResponse.json({ user: { name: user.name, email: user.email } });
  res.cookies.set("token", token, { httpOnly: true });
  return res;
}
