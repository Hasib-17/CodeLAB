// app/api/problems/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import { Problem } from "@/models/Problem";

export async function GET(req) {
    try {
        await dbConnect();

        const url = req.nextUrl;
        const courseCode = url.searchParams.get("courseCode");
        const inExamParam = url.searchParams.get("inExam"); // "true" or "false"
        const limitParam = url.searchParams.get("limit");
        const limit = limitParam ? parseInt(limitParam, 10) : 100;

        const filter = { deleted: false };

        if (courseCode) {
            // match either legacy `category` or explicit `courseCode`
            filter.$or = [{ category: courseCode }, { courseCode: courseCode }];
        }

        if (inExamParam !== null) {
            // if inExamParam provided, filter by boolean value
            if (inExamParam === "true") filter.inExam = true;
            else if (inExamParam === "false") filter.inExam = false;
        }

        const query = Problem.find(filter).sort({ createdAt: -1 });
        // apply limit if > 0. limit === 0 => no limit
        if (Number.isInteger(limit) && limit > 0) query.limit(limit);

        const problems = await query.lean().exec();
        return NextResponse.json(problems, { status: 200 });
    } catch (err) {
        console.error("GET /api/problems error:", err);
        return NextResponse.json({ error: err.message || "Failed to fetch problems" }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        await dbConnect();

        const body = await req.json();

        const {
            courseCode,
            courseTitle,
            title,
            problemStatement,
            inputFormat,
            outputFormat,
            sampleInput,
            sampleOutput,
            constraints,
        } = body ?? {};

        if (!title || !problemStatement) {
            return NextResponse.json({ error: "title and problemStatement are required" }, { status: 400 });
        }

        // generate unique id
        const id = `prob-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        const created = await Problem.create({
            id,
            title,
            problemStatement,
            inputFormat,
            outputFormat,
            sampleInput,
            sampleOutput,
            constraints,
            courseCode: courseCode ?? "",
            courseTitle: courseTitle ?? "",
            // maintain legacy fields for compatibility
            category: courseCode ?? "",
            companies: courseTitle ? [courseTitle] : [],
        });

        return NextResponse.json({ success: true, created }, { status: 201 });
    } catch (err) {
        console.error("POST /api/problems error:", err);
        return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
    }
}
