// app/api/get-cs-questions/route.js
import dbConnect from '@/utils/dbConnect';
import { VivaCourse } from '@/models/VivaCourse';
import mongoose from 'mongoose';

export async function GET(req) {
    try {
        await dbConnect();
        const url = new URL(req.url);
        const courseCode = url.searchParams.get('courseCode');

        if (!courseCode) {
            return new Response(JSON.stringify({ error: 'courseCode required' }), { status: 400 });
        }

        // Match course, unwind questions and sample 10
        const pipeline = [
            { $match: { courseCode } },
            { $unwind: '$questions' },
            { $sample: { size: 10 } },
            {
                $project: {
                    _id: '$questions._id',
                    question: '$questions.question',
                    // do not include correct_answer
                }
            }
        ];

        const results = await VivaCourse.aggregate(pipeline);

        const course = await VivaCourse.findOne({ courseCode }).lean();

        if (!course) {
            return new Response(JSON.stringify({ error: 'Course not found' }), { status: 404 });
        }

        // return questions + metadata
        return new Response(JSON.stringify({
            courseCode: course.courseCode,
            courseTitle: course.courseTitle,
            examDurationSeconds: course.examDurationSeconds,
            questions: results
        }), { status: 200 });

    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: 'Server error', details: String(err) }), { status: 500 });
    }
}
