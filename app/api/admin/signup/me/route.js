import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/db";
import { Admin } from "@/models/Admin";

const SECRET = process.env.JWT_SECRET || "secret_key";

export async function GET(req) {
    try {
        await connectDB();
        const token = req.headers.get("authorization")?.split(" ")[1];
        if (!token) return NextResponse.json({ message: "No token" }, { status: 401 });

        const decoded = jwt.verify(token, SECRET);
        const admin = await Admin.findById(decoded.id).select("-password");

        if (!admin) return NextResponse.json({ message: "Admin not found" }, { status: 404 });

        return NextResponse.json(admin);
    } catch (error) {
        console.error("Get admin error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
