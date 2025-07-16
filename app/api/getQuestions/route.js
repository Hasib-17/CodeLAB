import { Question } from "@/models/Question";
import dbConnect from '@/utils/dbConnect';

export async function GET() {
  await dbConnect();

  try {
    // Get 1 random question document
    const questions = await Question.aggregate([{ $sample: { size: 1 } }]);

    // Return as JSON string with 200 status
    return new Response(JSON.stringify(questions), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching questions:", error);

    // Return error JSON with 500 status
    return new Response(
      JSON.stringify({ error: "Failed to fetch questions" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
