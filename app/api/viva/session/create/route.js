// app/api/viva/session/create/route.js
import dbConnect from '@/utils/dbConnect';
import { VivaCourse } from '@/models/VivaCourse';
import { ActiveExam } from '@/models/ActiveExam';

function makeId() {
    // simple unique string id: timestamp + random
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function POST(req) {
    try {
        await dbConnect();
        const body = await req.json();
        const { courseCode, sampleSize = 10, durationSeconds } = body || {};

        if (!courseCode) {
            return new Response(JSON.stringify({ error: 'courseCode required' }), { status: 400 });
        }

        const course = await VivaCourse.findOne({ courseCode }).lean();
        if (!course) {
            return new Response(JSON.stringify({ error: 'Course not found' }), { status: 404 });
        }

        // If the course has fewer questions than sampleSize, just use all
        const source = course.questions || [];
        // shuffle (Fisher-Yates) and slice
        for (let i = source.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [source[i], source[j]] = [source[j], source[i]];
        }
        const picked = source.slice(0, Math.min(sampleSize, source.length));

        // Build ActiveExam questions with string _id
        const questions = picked.map(q => ({
            _id: makeId(),
            question: q.question,
            answer: q.correct_answer
        }));

        const sessionId = makeId(); // or use uuid lib

        const examDoc = new ActiveExam({
            sessionId,
            courseCode: course.courseCode,
            courseTitle: course.courseTitle,
            questions,
            examDurationSeconds: durationSeconds ?? course.examDurationSeconds ?? 60 * 10, // fallback
            createdAt: new Date()
        });

        await examDoc.save();

        // return sanitized
        return new Response(JSON.stringify({
            sessionId: examDoc.sessionId,
            courseCode: examDoc.courseCode,
            courseTitle: examDoc.courseTitle,
            examDurationSeconds: examDoc.examDurationSeconds,
            questions: questions.map(q => ({ _id: q._id, question: q.question }))
        }), { status: 201 });

    } catch (err) {
        console.error('POST /api/viva/session/create error', err);
        return new Response(JSON.stringify({ error: 'Server error', details: String(err) }), { status: 500 });
    }
}
