// app/api/exam/current/route.js
import dbConnect from '@/utils/dbConnect';
import ExamSetup from '@/models/ExamSetup';

export const runtime = 'nodejs';

export async function GET() {
    try {
        await dbConnect();
        // get the latest active exam
        const exam = await ExamSetup.findOne({ active: true }).sort({ createdAt: -1 }).lean();
        if (!exam) return new Response(JSON.stringify({ ok: false, message: 'no active exam' }), { status: 200 });

        return new Response(JSON.stringify({
            ok: true,
            exam: {
                id: exam._id,
                courseCode: exam.courseCode,
                courseTitle: exam.courseTitle,
                durationSeconds: exam.durationSeconds,
                batchId: exam.batchId
            }
        }), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
