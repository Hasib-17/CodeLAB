// app/api/admin/set-exam/route.js
import dbConnect from '@/utils/dbConnect';
import ExamSetup from '@/models/ExamSetup';

export const runtime = 'nodejs';

export async function POST(req) {
    try {
        await dbConnect();
        const body = await req.json();
        const { courseCode, courseTitle, timeHHMM, batchId } = body;
        if (!courseCode || !courseTitle || !timeHHMM || !batchId) {
            return new Response(JSON.stringify({ error: 'courseCode, courseTitle, timeHHMM, batchId required' }), { status: 400 });
        }

        // parse HH:MM into seconds
        const [hh, mm] = timeHHMM.split(':').map(s => Number(s));
        const durationSeconds = (Number.isFinite(hh) ? hh : 0) * 3600 + (Number.isFinite(mm) ? mm : 0) * 60;

        const examSetup = new ExamSetup({
            batchId,
            courseCode,
            courseTitle,
            durationSeconds,
            active: true
        });
        await examSetup.save();

        return new Response(JSON.stringify({ ok: true, examSetupId: examSetup._id }), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
