import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from '@/utils/dbConnect';
import { User } from "@/models/User";

export async function POST(req) {
  try {
    await dbConnect();
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Missing email or password" }, { status: 400 });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ message: "User already exists" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashed, name: name || "" });

    // remove password before returning
    const ret = user.toObject();
    delete ret.password;

    return NextResponse.json(ret, { status: 201 });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
