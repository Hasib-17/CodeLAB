// app/api/viva/create-session/route.js
import dbConnect from '@/utils/dbConnect';
import { ActiveExam } from '@/models/ActiveExam';
import { randomUUID } from 'crypto';
import mongoose from 'mongoose';

export async function POST(req) {
    try {
        await dbConnect();

        const body = await req.json();
        const { courseCode, courseTitle, questions, examDurationSeconds } = body;

        if (!courseCode || !String(courseCode).trim()) {
            return new Response(JSON.stringify({ error: 'courseCode required' }), { status: 400 });
        }

        if (!Array.isArray(questions) || questions.length < 10) {
            return new Response(JSON.stringify({ error: 'At least 10 question-answer pairs required' }), { status: 400 });
        }

        if (typeof examDurationSeconds !== 'number' || isNaN(examDurationSeconds) || examDurationSeconds <= 0) {
            return new Response(JSON.stringify({ error: 'examDurationSeconds required (positive number)' }), { status: 400 });
        }

        // Build questions array that matches ActiveExam schema:
        // each item: { _id: ObjectId, question: string, answer: string }
        const sanitized = questions.map(q => ({
            _id: new mongoose.Types.ObjectId(),
            question: (q?.question || '').trim(),
            // accept either 'answer' or 'correct_answer' from client but store as 'answer'
            answer: (q?.answer || q?.correct_answer || '').trim()
        })).filter(q => q.question && q.answer);

        if (sanitized.length < 10) {
            return new Response(JSON.stringify({ error: 'At least 10 valid question-answer pairs required (non-empty)' }), { status: 400 });
        }

        const sessionId = randomUUID();

        const doc = await ActiveExam.create({
            sessionId,
            courseCode: String(courseCode).trim(),
            courseTitle: courseTitle ? String(courseTitle).trim() : '',
            questions: sanitized,
            examDurationSeconds,
            createdAt: new Date()
        });

        return new Response(JSON.stringify({
            ok: true,
            sessionId,
            link: `/viva?sessionId=${sessionId}`
        }), { status: 201 });

    } catch (err) {
        console.error('create-session error:', err);
        // return the error message so you can debug in dev; in production you may hide details
        return new Response(JSON.stringify({ error: 'Server error', details: String(err?.message || err) }), { status: 500 });
    }
}
