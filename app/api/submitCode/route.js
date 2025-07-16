import dbConnect from '@/utils/dbConnect';
import { Problem } from "@/models/Problem";
import { User } from "@/models/User";
import { UserInfo } from "@/models/UserInfo.js";
import { SolvedProblem } from "@/models/SolvedProblem";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route.js";

export async function POST(req) {
    await dbConnect();

    let session;
    try {
        session = await getServerSession(authOptions);
    } catch (error) {
        console.error('Error getting session:', error);
        return new Response(JSON.stringify({ error: 'Failed to get session' }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }

    const userID = session?.user?._id;

    if (!userID) {
        return new Response(JSON.stringify({ error: 'User Not Found' }), {
            status: 401,
            headers: { "Content-Type": "application/json" }
        });
    }

    let payload;
    try {
        payload = await req.json();
    } catch (error) {
        console.error('Error parsing request body:', error);
        return new Response(JSON.stringify({ error: 'Invalid request body' }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
        });
    }

    const { code, problem, language, contest } = payload;

    try {
        // Fetch problem and user data
        const user = await User.findById(userID);
        const userdata = await UserInfo.findById(user.userInfo).populate('solved');
        const prob = await Problem.findOne({ id: problem });

        if (!prob) {
            return new Response(JSON.stringify({ error: 'Problem not found' }), {
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        }

        const existingSolvedProblem = userdata.solved.find(
            (solvedProblem) => solvedProblem.problem.equals(prob._id)
        );

        let allPassed = true;
        let failedCase = null;

        // Loop over all test cases
        for (let i = 0; i < prob.testCases[0].input.length; i++) {
            try {
                const pistonRes = await fetch('https://emkc.org/api/v2/piston/execute', {
                    method: 'POST',
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        language: language,
                        version: "*",
                        files: [{ content: code }],
                        stdin: prob.testCases[0].input[i]
                    })
                });

                const data = await pistonRes.json();
                const actualOutput = data.run?.stdout?.trim() || "";
                const expectedOutput = prob.testCases[0].output[i].trim();

                console.log(`✅ Test case ${i + 1}:`);
                console.log('Input:', JSON.stringify(prob.testCases[0].input[i]));
                console.log('Expected:', JSON.stringify(expectedOutput));
                console.log('Actual:', JSON.stringify(actualOutput));

                if (actualOutput !== expectedOutput) {
                    allPassed = false;
                    failedCase = { actualOutput, expectedOutput, input: prob.testCases[0].input[i] };
                    break;
                }
            } catch (error) {
                console.error('Error running code on Piston:', error);
                return new Response(JSON.stringify({ error: 'Failed to run code' }), {
                    status: 500,
                    headers: { "Content-Type": "application/json" }
                });
            }
        }

        const isAccepted = allPassed ? "accepted" : "rejected";
        const passedTestCases = allPassed ? prob.testCases[0].input.length : 0;

        const newSolution = {
            contest: contest !== null ? contest : undefined,
            code: code,
            complexity: [],
            status: isAccepted,
            passedTestCases: passedTestCases
        };

        if (existingSolvedProblem) {
            existingSolvedProblem.solution.push(newSolution);
            await existingSolvedProblem.save();
        } else {
            if ((isAccepted && contest) || !contest) {
                const newSolve = new SolvedProblem({
                    contest: contest !== null ? contest : undefined,
                    problem: prob._id,
                    solution: [newSolution]
                });
                const newSol = await newSolve.save();
                userdata.solved.push(newSol.id);
                await userdata.save();
            }
        }

        return new Response(JSON.stringify({
            isAccepted,
            output: allPassed ? "All test cases passed" : failedCase?.actualOutput
        }), {
            status: 201,
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error('Error in submitCode API:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
