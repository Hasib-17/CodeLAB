// app/api/exam/submit/route.js
import dbConnect from '@/utils/dbConnect';
import ExamInstance from '@/models/ExamInstance';
import MCQuestion from '@/models/MCQuestion'; // adjust name
import ExamSetup from '@/models/ExamSetup';
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

        const examInst = await ExamInstance.findById(examInstanceId);
        if (!examInst) return new Response(JSON.stringify({ error: 'exam instance not found' }), { status: 404 });

        // owner check
        if (String(examInst.studentId) !== String(studentId)) {
            return new Response(JSON.stringify({ error: 'Forbidden: not your exam' }), { status: 403 });
        }
        if (examInst.submittedAt) return new Response(JSON.stringify({ error: 'already submitted' }), { status: 400 });

        // check time
        const examSetup = await ExamSetup.findById(examInst.examSetupId).lean();
        const maxMs = (examSetup?.durationSeconds || 0) * 1000;
        const elapsed = Date.now() - new Date(examInst.startedAt).getTime();

        // Option: reject late submit
        // if (elapsed > maxMs) return new Response(JSON.stringify({ error: 'time over' }), { status: 400 });

        // grading
        const qIds = examInst.questions.map(q => q.questionId);
        const qDocs = await MCQuestion.find({ _id: { $in: qIds } }).lean();
        const qMap = Object.fromEntries(qDocs.map(q => [String(q._id), q]));

        let score = 0;
        const usedAnswers = answers || examInst.answers || [];
        for (const a of usedAnswers) {
            const q = qMap[String(a.questionId)];
            if (!q) continue;
            if (q.correctIndex === a.selectedIndex) score += 1;
        }

        examInst.answers = usedAnswers;
        examInst.score = score;
        examInst.submittedAt = new Date();
        await examInst.save();

        return new Response(JSON.stringify({ ok: true, score, total: examInst.questions.length }), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
