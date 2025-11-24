// app/api/submit-cs-test/route.js
import dbConnect from '@/utils/dbConnect';
import { ActiveExam } from '@/models/ActiveExam';
import { VivaCourse } from '@/models/VivaCourse'; // if you also keep VivaCourse for course docs
import mongoose from 'mongoose';

export async function POST(req) {
    try {
        await dbConnect();
        const { answers = {}, courseCode, sessionId } = await req.json();

        if (!sessionId && !courseCode) {
            return new Response(JSON.stringify({ error: 'sessionId or courseCode required' }), { status: 400 });
        }

        // Get the correct answers mapping depending on source
        let correctMap = {};

        if (sessionId) {
            const exam = await ActiveExam.findOne({ sessionId }).lean();
            if (!exam) return new Response(JSON.stringify({ error: 'Session not found' }), { status: 404 });

            exam.questions.forEach(q => {
                correctMap[String(q._id)] = (q.correct_answer || '').trim();
            });
        } else {
            // fallback to VivaCourse (existing course-level questions)
            const questionIds = Object.keys(answers).map(id => {
                try { return mongoose.Types.ObjectId(id); } catch (e) { return null; }
            }).filter(Boolean);

            if (questionIds.length === 0) {
                // If no ObjectIds, try basic match by comparing to questions in course
                const course = await VivaCourse.findOne({ courseCode }).lean();
                if (!course) return new Response(JSON.stringify({ error: 'Course not found' }), { status: 404 });
                course.questions.forEach(q => {
                    correctMap[String(q._id)] = (q.correct_answer || '').trim();
                });
            } else {
                // use aggregation to fetch specified question IDs
                const pipeline = [
                    { $match: { courseCode } },
                    { $unwind: '$questions' },
                    { $match: { 'questions._id': { $in: questionIds } } },
                    { $project: { _id: '$questions._id', correct_answer: '$questions.correct_answer' } }
                ];
                const docs = await VivaCourse.aggregate(pipeline);
                docs.forEach(d => { correctMap[String(d._id)] = (d.correct_answer || '').trim(); });
            }
        }

        let correctCount = 0;
        let totalChecked = 0;
        for (const [qid, userAns] of Object.entries(answers)) {
            if (!correctMap.hasOwnProperty(qid)) continue;
            totalChecked++;
            const a = (String(userAns || '')).trim().toLowerCase();
            const b = (String(correctMap[qid] || '')).trim().toLowerCase();
            if (a && b && a === b) correctCount++;
        }

        const percentage = totalChecked > 0 ? Math.round((correctCount / totalChecked) * 100) : 0;
        return new Response(JSON.stringify({ percentage, totalChecked, correctCount }), { status: 200 });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: 'Server error', details: String(err) }), { status: 500 });
    }
}
