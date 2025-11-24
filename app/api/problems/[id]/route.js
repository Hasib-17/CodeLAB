// app/api/problems/[id]/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import { Problem } from "@/models/Problem";

export async function GET(req, { params }) {
    try {
        await dbConnect();
        const { id } = params;

        const problem = await Problem.findOne({ id, deleted: false }).lean().exec();
        if (!problem) {
            return NextResponse.json({ error: "Problem not found" }, { status: 404 });
        }
        return NextResponse.json(problem, { status: 200 });
    } catch (err) {
        console.error("GET /api/problems/[id] error:", err);
        return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req, { params }) {
    try {
        await dbConnect();
        const { id } = params;
        const body = await req.json();

        // Allowed updates — include inExam field
        const allowed = [
            "title",
            "problemStatement",
            "inputFormat",
            "outputFormat",
            "sampleInput",
            "sampleOutput",
            "constraints",
            "courseCode",
            "courseTitle",
            "category",
            "inExam",
        ];

        const update = {};
        for (const key of allowed) {
            if (Object.prototype.hasOwnProperty.call(body, key) && body[key] !== undefined) {
                if (key === "courseCode" || key === "category") {
                    // keep both in sync for legacy compatibility
                    update.courseCode = body[key];
                    update.category = body[key];
                } else if (key === "courseTitle") {
                    update.courseTitle = body[key];
                    update.companies = body[key] ? [body[key]] : [];
                } else if (key === "inExam") {
                    // Accept booleans or strings "true"/"false"
                    if (typeof body.inExam === "string") {
                        update.inExam = body.inExam === "true";
                    } else {
                        update.inExam = !!body.inExam;
                    }
                } else {
                    update[key] = body[key];
                }
            }
        }

        // Always set updatedAt to current date (so other clients/polls see the change timestamp)
        const updated = await Problem.findOneAndUpdate(
            { id },
            { $set: update, $currentDate: { updatedAt: true } },
            { new: true, runValidators: true }
        ).lean().exec();

        if (!updated) {
            return NextResponse.json({ error: "Problem not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, updated }, { status: 200 });
    } catch (err) {
        console.error("PUT /api/problems/[id] error:", err);
        return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        await dbConnect();
        const { id } = params;

        // Soft delete: set deleted=true
        const updated = await Problem.findOneAndUpdate({ id }, { $set: { deleted: true }, $currentDate: { updatedAt: true } }, { new: true }).lean().exec();
        if (!updated) {
            return NextResponse.json({ error: "Problem not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (err) {
        console.error("DELETE /api/problems/[id] error:", err);
        return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
    }
}
