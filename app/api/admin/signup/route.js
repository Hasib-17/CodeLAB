import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from '@/utils/dbConnect';
import { Admin } from "@/models/Admin";

export async function POST(req) {
    try {
        await dbConnect();

        const { name, email, password } = await req.json();

        const existing = await Admin.findOne({ email });
        if (existing) {
            return NextResponse.json({ message: "Admin already exists" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await Admin.create({
            name,
            email,
            password: hashedPassword,
        });

        return NextResponse.json({ message: "Admin created", admin }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
