// app/api/viva/session/[sessionId]/route.js
import dbConnect from '@/utils/dbConnect';
import { ActiveExam } from '@/models/ActiveExam';

export async function GET(req, { params }) {
    try {
        await dbConnect();
        const { sessionId } = params;
        if (!sessionId) {
            return new Response(JSON.stringify({ error: 'sessionId required' }), { status: 400 });
        }

        const exam = await ActiveExam.findOne({ sessionId }).lean();
        if (!exam) {
            return new Response(JSON.stringify({ error: 'Session not found' }), { status: 404 });
        }

        const questions = (exam.questions || []).map(q => ({
            _id: q._id ?? q.id ?? null,
            question: q.question ?? ''
        }));

        const sanitized = {
            sessionId: exam.sessionId,
            courseCode: exam.courseCode,
            courseTitle: exam.courseTitle,
            examDurationSeconds: exam.examDurationSeconds,
            createdAt: exam.createdAt,
            expiresAt: exam.expiresAt,
            questions
        };

        return new Response(JSON.stringify(sanitized), { status: 200 });
    } catch (err) {
        console.error('GET /api/viva/session/[sessionId] error', err);
        return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
    }
}
