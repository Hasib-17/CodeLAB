// app/api/viva/session/[sessionId]/answers/route.js
import dbConnect from '@/utils/dbConnect';
import mongoose from 'mongoose';
import { ActiveExam } from '@/models/ActiveExam';

export async function GET(req, { params }) {
    try {
        await dbConnect();

        const { sessionId } = params;
        if (!sessionId) {
            return new Response(JSON.stringify({ error: 'sessionId required' }), { status: 400 });
        }

        // Use the Mongoose model to find the exam doc
        // Use .lean() to get POJO. If your schema uses select:false on nested fields,
        // lean() still returns database fields; if not, we fallback using raw collection.
        let exam = await ActiveExam.findOne({ sessionId }).lean();

        // If for some reason Mongoose didn't bring the nested answer fields (rare),
        // read directly from the underlying collection (raw) to ensure answers are available.
        if (!exam) {
            // not found
            return new Response(JSON.stringify({ error: 'Session not found' }), { status: 404 });
        }

        // compute expiry: prefer expiresAt if set, otherwise createdAt + examDurationSeconds
        const now = new Date();
        let expiresAt = null;
        if (exam.expiresAt) expiresAt = new Date(exam.expiresAt);
        else if (exam.createdAt && exam.examDurationSeconds >= 0) {
            expiresAt = new Date(new Date(exam.createdAt).getTime() + (Number(exam.examDurationSeconds) * 1000));
        }

        // If the exam is not yet expired, prevent returning answers
        if (expiresAt && now < expiresAt) {
            return new Response(JSON.stringify({ error: 'Answers are available only after the exam has ended' }), { status: 403 });
        }

        // Map questions to include correct answer
        const questionsWithAnswers = (exam.questions || []).map(q => ({
            _id: String(q._id ?? q.id ?? ''),
            question: q.question ?? '',
            answer: q.answer ?? q.correct_answer ?? null // support both field names
        }));

        return new Response(JSON.stringify({
            sessionId: exam.sessionId,
            courseCode: exam.courseCode,
            courseTitle: exam.courseTitle,
            examDurationSeconds: exam.examDurationSeconds,
            questions: questionsWithAnswers
        }), { status: 200 });

    } catch (err) {
        console.error('GET /api/viva/session/[sessionId]/answers error', err);
        return new Response(JSON.stringify({ error: 'Server error', details: String(err) }), { status: 500 });
    }
}
