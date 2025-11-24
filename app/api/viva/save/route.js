// app/api/viva/save/route.js
import dbConnect from '@/utils/dbConnect';
import { VivaCourse } from '@/models/VivaCourse';

export async function POST(req) {
    try {
        await dbConnect();
        const body = await req.json();
        const { courseCode, courseTitle, examTimeHHMM, questions } = body;

        if (!courseCode || !courseTitle || !examTimeHHMM) {
            return new Response(JSON.stringify({ error: 'courseCode, courseTitle and examTimeHHMM are required' }), { status: 400 });
        }

        // examTimeHHMM should be "hh:mm"
        const parts = examTimeHHMM.split(':');
        if (parts.length !== 2) {
            return new Response(JSON.stringify({ error: 'Invalid examTimeHHMM format. Use hh:mm' }), { status: 400 });
        }
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        if (isNaN(hours) || isNaN(minutes)) {
            return new Response(JSON.stringify({ error: 'Invalid hours or minutes' }), { status: 400 });
        }
        const durationSeconds = hours * 3600 + minutes * 60;

        if (!Array.isArray(questions) || questions.length < 10) {
            return new Response(JSON.stringify({ error: 'At least 10 questions are required' }), { status: 400 });
        }

        // sanitize questions -> ensure each has question and answer
        const sanitized = questions.map(q => ({
            question: (q.question || '').trim(),
            correct_answer: (q.answer || '').trim()
        })).filter(q => q.question && q.correct_answer);

        if (sanitized.length < 10) {
            return new Response(JSON.stringify({ error: 'At least 10 valid question-answer pairs required' }), { status: 400 });
        }

        // Upsert by courseCode
        const updated = await VivaCourse.findOneAndUpdate(
            { courseCode },
            {
                courseCode,
                courseTitle,
                examDurationSeconds: durationSeconds,
                questions: sanitized
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        ).lean();

        return new Response(JSON.stringify({ ok: true, course: updated }), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: 'Server error', details: String(err) }), { status: 500 });
    }
}
