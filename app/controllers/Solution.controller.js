import { asyncHandler } from "../utils/asyncHandler.js";
import Problem from "../models/Problem.js";
import { StatusCodes, ReasonPhrases } from "http-status-codes";
import { solutionValidation } from "../validation/problemAssetsValidation.js";
import Solution from "../models/Solution.js";
import ApiError from "../utils/apiError.js";
import axios from "axios";
import { base64Decode } from "../utils/base64.js";
import { fetchCompilerOutput } from "../utils/fetchSubmission.js";
import { axoisCEEHeaders } from "../constants.js";

// @desc      Get all solutions of a problem
// @route     GET /api/solutions/problem/:id
const getSolution = asyncHandler(async (req, res) => {
    // 1. get the problem id from the request params
    // 2. check if the problem exists
    // 3. get the solution ids from the problem
    // 4. get all the solutions from the database
    // 5. return the solutions

    try {
        const problemId = req.params.id;
        const problem = await Problem.findById(problemId);
        if (!problem) {
            throw new ApiError(
                StatusCodes.NOT_FOUND,
                ReasonPhrases.NOT_FOUND,
                "Problem not found"
            );
        }

        const solutionIds = problem.solutionIds;
        const solutions = await Solution.find({ _id: { $in: solutionIds } });

        res.status(StatusCodes.OK).json({
            status: StatusCodes.OK,
            success: true,
            data: solutions,
        });
    } catch (error) {
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            ReasonPhrases.INTERNAL_SERVER_ERROR,
            error.message
        );
    }
});

// @desc      add a solution to a problem
// @route     POST /api/solutions/problem/:id
const createSolution = asyncHandler(async (req, res) => {
    // 1. get the source code and language id from the request body
    // 2. get the problem id from the request params
    // 3. check if the problem exists
    // 4. submit the source code to the compiler
    // 5. get the token from the compiler
    // 6. get the submission status from the compiler
    // 7. check if the submission is successful
    // 8. add the sol id to the problem
    // 9. save the solution to the database
    // 10. send the response

    let { source_code, languageId } = req.body;
    const problemId = req.params.id;

    if (!source_code || !languageId) {
        throw new ApiError(
            StatusCodes.BAD_REQUEST,
            ReasonPhrases.BAD_REQUEST,
            "source_code and language_id are required"
        );
    }

    const problem = await Problem.findById(problemId);
    if (!problem) {
        throw new ApiError(
            StatusCodes.NOT_FOUND,
            ReasonPhrases.NOT_FOUND,
            "Problem not found"
        );
    }

    // check the solution already exists
    const existingSolution = await Solution.findOne({
        problemId,
    })
        .where("source_code")
        .equals(source_code)
        .where("languageId")
        .equals(languageId);
    if (existingSolution) {
        throw new ApiError(
            StatusCodes.BAD_REQUEST,
            ReasonPhrases.BAD_REQUEST,
            "Solution already exists"
        );
    }

    // submit the source code to the compiler and get the token

    const axoisCreateOptions = {
        method: "POST",
        url: `${process.env.CEE_URI}/submissions`,
        params: {
            base64_encoded: "true",
            wait: "false",
        },
        headers: axoisCEEHeaders,
        data: {
            source_code,
            language_id: languageId,
        },
    };

    let token = "";

    try {
        const response = await axios.request(axoisCreateOptions);
        token = response.data.token;
    } catch (error) {
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            ReasonPhrases.INTERNAL_SERVER_ERROR,
            error.message
        );
    }

    const result = await fetchCompilerOutput(token);

    if (result.status !== StatusCodes.OK) {
        throw new ApiError(
            result.status,
            "Compilation Error",
            base64Decode(result.message)
        );
    }

    // save the solution to the database

    const solutionData = {
        problemId,
        languageId,
        source_code,
        authorId: req.user._id.toString(),
    };

    if (problem.solutionIds.length == 0) {
        solutionData.isOptimal = true;
    }
    const validationResult = solutionValidation.safeParse(solutionData);
    if (!validationResult.success) {
        console.log("here");
        throw new ApiError(
            StatusCodes.BAD_REQUEST,
            ReasonPhrases.BAD_REQUEST,
            validationResult.error
        );
    }

    const solution = await Solution.create(solutionData);

    problem.solutionIds.push(solution._id);
    await problem.save();

    res.status(StatusCodes.CREATED).json({
        status: StatusCodes.CREATED,
        success: true,
        data: solution,
    });
});

// @desc      Get a single solution
// @route     GET /api/solutions/:id/:solId
const getSolutionById = asyncHandler(async (req, res) => {
    // 1. get the solution id from the request params\
    // 2. check if the solution exists
    // 3. return the solution

    const solutionId = req.params.solId;
    const solution = await Solution.findById(solutionId);

    if (!solution) {
        throw new ApiError(
            StatusCodes.NOT_FOUND,
            ReasonPhrases.NOT_FOUND,
            "Solution not found"
        );
    }

    res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        success: true,
        data: solution,
    });
});

// @desc     Update a solution
// @route     PUT /api/solutions/:id/:solId
const updateSolution = asyncHandler(async (req, res) => {
    // 1. get the solution id from the request params
    // 2. check if the solution exists
    // 3. update the solution
    // 4. save the solution to the database

    const solutionId = req.params.solId;
    const solution = await Solution.findById(solutionId);
    if (!solution) {
        throw new ApiError(
            StatusCodes.NOT_FOUND,
            ReasonPhrases.NOT_FOUND,
            "Solution not found"
        );
    }
    let source_code = req.body?.source_code;
    let languageId = req.body?.languageId;
    if (!languageId) {
        languageId = solution.languageId;
    }

    const validationResult = solutionValidation
        .pick({ source_code: true, languageId: true })
        .safeParse({
            source_code,
            languageId,
        });
    if (!validationResult.success) {
        throw new ApiError(
            StatusCodes.BAD_REQUEST,
            ReasonPhrases.BAD_REQUEST,
            validationResult.error
        );
    }

    const axoisCreateOptions = {
        method: "POST",
        url: `${process.env.CEE_URI}/submissions`,
        params: {
            base64_encoded: "true",
            wait: "false",
        },
        headers: axoisCEEHeaders,
        data: {
            source_code,
            language_id: languageId,
        },
    };

    let token = "";

    try {
        const response = await axios.request(axoisCreateOptions);
        token = response.data.token;
    } catch (error) {
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            ReasonPhrases.INTERNAL_SERVER_ERROR,
            error.message
        );
    }

    const result = await fetchCompilerOutput(token);

    if (result.status !== StatusCodes.OK) {
        throw new ApiError(
            result.status,
            "Compilation Error",
            base64Decode(result.message)
        );
    }

    solution.source_code = source_code;
    solution.languageId = languageId;

    await solution.save();

    res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        success: true,
        data: solution,
    });
});

// @desc      Delete a solution
// @route     DELETE /api/solutions/:id/:solId
const deleteSolution = asyncHandler(async (req, res) => {
    // 1. get the solution id from the request params
    // 2. check if the solution exists
    // 3. delete the solution
    // 4. remove the solution id from the problem
    // 5. save the problem to the database

    const solutionId = req.params.solId;
    const solution = await Solution.findById(solutionId);
    if (!solution) {
        throw new ApiError(
            StatusCodes.NOT_FOUND,
            ReasonPhrases.NOT_FOUND,
            "Solution not found"
        );
    }

    const problem = await Problem.findById(solution.problemId);
    if (!problem) {
        throw new ApiError(
            StatusCodes.NOT_FOUND,
            ReasonPhrases.NOT_FOUND,
            "Problem not found"
        );
    }

    const index = problem.solutionIds.indexOf(solutionId);
    if (index > -1) {
        problem.solutionIds.splice(index, 1);
    }

    await problem.save();
    await solution.deleteOne({ _id: solutionId });

    res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        success: true,
        data: {},
    });
});

export {
    getSolution,
    createSolution,
    getSolutionById,
    updateSolution,
    deleteSolution,
};