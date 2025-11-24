// app/api/viva/session/latest/route.js
import dbConnect from '@/utils/dbConnect';
import { ActiveExam } from '@/models/ActiveExam';

export async function GET(req) {
    try {
        await dbConnect();

        // Return the latest active exam that is not expired (optional)
        const now = new Date();
        const exam = await ActiveExam.findOne({
            $or: [
                { expiresAt: { $exists: false } },
                { expiresAt: { $gt: now } }
            ]
        }).sort({ createdAt: -1 }).lean();

        if (!exam) {
            return new Response(JSON.stringify({ error: 'No active session found' }), { status: 404 });
        }

        // Ensure we only return question id + question text (no answers)
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
        console.error('GET /api/viva/session/latest error', err);
        return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
    }
}
