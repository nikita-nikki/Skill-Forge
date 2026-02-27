import { Submission } from "../models/submission.js";
import { Task } from "../models/task.js";
import { Evaluation } from "../models/evaluation.js";
import { Track } from "../models/track.js";
import { Module } from "../models/module.js";
import { Enrollment } from "../models/enrollment.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { MAX_RETRIES } from "../config/constants.js";


const evaluateSubmission = asyncHandler( async(req, res) => {
    const { submissionId } = req.params
    if(!submissionId){
        throw new ApiError(400, "SubmissionId is required.")
    }
    const submission = await Submission.findById(submissionId)
    if(!submission){
        throw new ApiError(404, "Submission not found.")
    }
    //console.log("Current status:", submission.status);

    if( submission.status !== "pending"){
        throw new ApiError(400, "Submission already processing or evaluated.")
    }

    submission.status = "processing";
    await submission.save();

    simulateEvaluation(submissionId);

    return res
      .status(200)
      .json(new ApiResponse(
        200,
        null,
        "Evaluation started. Processing in background."
      ))

    // if( submission.status === "evaluated"){
    //     throw new ApiError(400, "Submission already evaluated.")
    // }
    // const task = await Task.findById(submission.task)
    // if(!task){
    //     throw new ApiError(404, "Task not found.")
    // }

    // const rubric = task.rubric || {};

    // const breakdown = {
    //     clarity: Math.floor(Math.random() * (rubric.clarity + 1)),
    //     correctness: Math.floor(Math.random() * (rubric.correctness + 1)),
    //     examples: Math.floor(Math.random() * (rubric.examples + 1)),
    // }

    // const totalScore = breakdown.clarity + breakdown.correctness + breakdown.examples;

    // const evaluation = await Evaluation.create({
    //     submission: submission._id,
    //     score: totalScore,
    //     breakdown,
    //     feedback: "AI simulated feedback: Good attempt. Improve structure and examples."
    // })

    // submission.status = "evaluated";
    // await submission.save();

    // return res
    //   .status(200)
    //   .json(new ApiResponse(
    //     200,
    //     evaluation,
    //     "Submission evaluated successfully"
    //   ))

})

const simulateEvaluation = async(submissionId) => {
    setTimeout( async() => {
        try {
            //console.log("Simulate called for:", submissionId);

            const submission = await Submission.findById(submissionId);
            if(!submission)return;

            const task = await Task.findById(submission.task);
            if(!task)return;

            const existingEvaluation = await Evaluation.findOne({ submission: submissionId });
            if (existingEvaluation) return;

            const rubric = task.rubric || {};

            const breakdown = {
                clarity: Math.floor(Math.random() * ((rubric.clarity || 0) + 1)),
                correctness: Math.floor(Math.random() * ((rubric.correctness || 0) + 1)),
                examples: Math.floor(Math.random() * ((rubric.examples || 0) + 1)),
            }

            const totalScore = breakdown.clarity + breakdown.correctness + breakdown.examples;

            await Evaluation.create({
                submission: submissionId,
                score: totalScore,
                breakdown,
                feedback: "AI simulated feedback (async)."
            });

            submission.status = "evaluated";
            await submission.save();

            const module = await Module.findById(task.module)
            if(!module) return;

            const track = await Track.findById(module.track)
            if(!track) return;

            const moduleIds = await Module.find({ track: track._id }).distinct("_id")

            const totalTasks = await Task.countDocuments({
                module: {$in: moduleIds}
            });

            const completedTasks = await Submission.distinct( "task", {
                user: submission.user,
                status: "evaluated"
            })

            const progress = totalTasks === 0 ? 0 : Math.floor((completedTasks.length / totalTasks) * 100 );

            await Enrollment.findOneAndUpdate(
                { user: submission.user, track: track._id},
                { progressPercentage: progress }
            );


        } catch (error) {
            console.log("Async evaluation failed: ", error);

            const submission = await Submission.findById(submissionId);
            if(!submission) return;

            submission.status = "failed";
            submission.retryCount += 1;
            await submission.save();
            
        }
    }, 3000); //3 second delay
};

const getEvaluationBySubmission = asyncHandler( async(req, res) => {
    const { submissionId } = req.params;

    const submission = await Submission.findById(submissionId)
    if(!submission){
        throw new ApiError(404, "Submission not found.")
    }

    const evaluation = await Evaluation.findOne({
        submission: submissionId
    });
    if(!evaluation){
        throw new ApiError(404, "Evaluation not found.")
    }

    //Access Control
    //for learner
    if(req.user.role === "learner"){
        if(!submission.user.equals(req.user._id)){
            throw new ApiError(403, "Not authorized to view this evaluation.")
        }
    }

    //for mentor

    if(req.user.role === "mentor"){
        const task = await Task.findById(submission.task)
        const module = await Module.findById(task.module)
        const track = await Track.findById(module.track)

        if(!track.createdBy.equals(req.user._id)){
            throw new ApiError(403, "Not authorized to view this evaluation.")
        }
    }

    return res 
      .status(200)
      .json(new ApiResponse(
        200,
        evaluation,
        "Evaluation fetched successfully."
      ))
})

const retryEvaluation = asyncHandler( async(req, res) => {
    const { submissionId } = req.params;

    const submission = await Submission.findById(submissionId);
    if(!submission){
        throw new ApiError(404, "Submission not found.")
    }

    if(submission.status !== "failed"){
        throw new ApiError(400, "Only failed submissions can be retried.")
    }
    if(submission.retryCount >= MAX_RETRIES){
        throw new ApiError(400, "Maximum retry attempts reached.");
    }

    submission.status = "processing";
    //submission.retryCount += 1;
    await submission.save();

    simulateEvaluation(submissionId);

    return res
      .status(200)
      .json( new ApiResponse(
        200,
        null,
        "Retry started."
      ))
})
export {
    evaluateSubmission,
    getEvaluationBySubmission,
    retryEvaluation
}