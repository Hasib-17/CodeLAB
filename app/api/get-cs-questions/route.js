import dbConnect from '@/utils/dbConnect';
import { CSTestAnswer } from "@/models/CSTestAnswer";

export async function GET() {
    await dbConnect();

    // get 5 random questions, only return question text (not correct_answer)
    const questions = await CSTestAnswer.aggregate([
        { $sample: { size: 10 } },
        { $project: { question: 1 } }
    ]);

    return Response.json(questions);
}
