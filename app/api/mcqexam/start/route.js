// app/api/exam/start/route.js
import dbConnect from '@/utils/dbConnect';
import ExamSetup from '@/models/ExamSetup';
import ExamInstance from '@/models/ExamInstance';
import MCQuestion from '@/models/MCQuestion'; // আপনার মডেল নাম অনুযায়ী ঠিক করুন (MCQuestion / MCQuestions / Question)
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';  // <-- FIXED PATH

export const runtime = 'nodejs';

export async function POST(req) {
    try {
        await dbConnect();

        // Get server session via NextAuth
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new Response(JSON.stringify({ error: 'Unauthorized - no session' }), { status: 401 });
        }
        const studentId = session.user.id;

        const body = await req.json();
        const size = body?.size ?? 10;

        const exam = await ExamSetup.findOne({ active: true }).sort({ createdAt: -1 }).lean();
        if (!exam) return new Response(JSON.stringify({ error: 'no active exam' }), { status: 400 });

        // Check existing instance (unfinished) for this student + this exam
        const existing = await ExamInstance.findOne({ studentId, examSetupId: exam._id, submittedAt: null });
        if (existing) {
            return new Response(JSON.stringify({
                ok: true,
                examInstanceId: existing._id,
                questions: existing.questions.map(q => ({ id: String(q.questionId), text: q.text, options: q.options, points: q.points })),
                startedAt: existing.startedAt
            }), { status: 200 });
        }

        // sample random questions from Questions with batchId
        const docs = await MCQuestion.aggregate([{ $match: { batchId: exam.batchId } }, { $sample: { size: Number(size) } }]);

        const snapshots = docs.map(d => ({
            questionId: d._id,
            text: d.text,
            options: d.options,
            points: d.points || 1
        }));

        const instance = new ExamInstance({
            studentId,
            examSetupId: new mongoose.Types.ObjectId(String(exam._id)),
            questions: snapshots,
            startedAt: new Date()
        });
        await instance.save();

        return new Response(JSON.stringify({
            ok: true,
            examInstanceId: instance._id,
            questions: instance.questions.map(q => ({ id: String(q.questionId), text: q.text, options: q.options, points: q.points })),
            startedAt: instance.startedAt
        }), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
