// app/api/exam/save/route.js
import dbConnect from '@/utils/dbConnect';
import ExamInstance from '@/models/ExamInstance';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
export const runtime = 'nodejs';

export async function POST(req) {
    try {
        await dbConnect();

        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        const studentId = session.user.id;

        const body = await req.json();
        const { examInstanceId, answers } = body;
        if (!examInstanceId) return new Response(JSON.stringify({ error: 'examInstanceId required' }), { status: 400 });

        const exam = await ExamInstance.findById(examInstanceId);
        if (!exam) return new Response(JSON.stringify({ error: 'exam not found' }), { status: 404 });

        // security: check ownership
        if (String(exam.studentId) !== String(studentId)) {
            return new Response(JSON.stringify({ error: 'Forbidden: not your exam' }), { status: 403 });
        }
        if (exam.submittedAt) return new Response(JSON.stringify({ error: 'already submitted' }), { status: 400 });

        exam.answers = answers;
        await exam.save();
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
