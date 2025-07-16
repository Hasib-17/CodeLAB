import { Problem } from "@/models/Problem";
import dbConnect from '@/utils/dbConnect';

export async function GET(req, { params }) {
    await dbConnect();

    const problem = await Problem.findOne({ id: params.id });
    if (!problem) {
        return new Response('Problem not found', { status: 404 });
    }

    return new Response(JSON.stringify(problem), { status: 200 });
}
