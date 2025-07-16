import dbConnect from '@/utils/dbConnect';
import { CSTestAnswer } from "@/models/CSTestAnswer";

export async function POST(req) {
    await dbConnect();
    const { answers } = await req.json();

    const allQuestions = await CSTestAnswer.find({});
    let correctCount = 0;

    allQuestions.forEach(q => {
        const userAnswer = (answers[q._id] || '').trim().toLowerCase();
        const correctAnswer = q.correct_answer.trim().toLowerCase();

        if (userAnswer === correctAnswer) {
            correctCount += 1;
        }
    });

    const percentage = Math.round((correctCount / allQuestions.length) * 100);
    return Response.json({ percentage });
}
