import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dbConnect from '@/utils/dbConnect';
import { Admin } from "@/models/Admin";

const SECRET = process.env.JWT_SECRET || "your_secret_key";

export async function POST(req) {
    try {
        await dbConnect();

        const { email, password } = await req.json();

        const admin = await Admin.findOne({ email });
        if (!admin) {
            return NextResponse.json({ message: "Admin not found" }, { status: 404 });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
        }

        const token = jwt.sign({ id: admin._id, role: "admin" }, SECRET, { expiresIn: "1d" });

        return NextResponse.json({ message: "Login successful", token });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
