import { Track } from "../models/track.js";
import { Module } from "../models/module.js";
import { Task } from  "../models/task.js";
import { Submission } from "../models/submission.js";
import { Enrollment } from "../models/enrollment.js";
import { Evaluation } from "../models/evaluation.js";

import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getTrackAnalytics = asyncHandler( async(req, res) => {
    const { trackId } = req.params
    const track = await Track.findById(trackId)
    if(!track){
        throw new ApiError(404, "Track not found.")
    }

    if(
        req.user.role === "mentor" &&
        !track.createdBy.equals(req.user._id)
    ){
        throw new ApiError(403, "Unauthorized Request.")
    }

    const moduleIds = await Module.find({ track: trackId }).distinct("_id");

    const taskIds = await Task.find({
        module: { $in: moduleIds }
    }).distinct("_id");

    const totalEnrollments = await Enrollment.countDocuments({
        track: trackId
    })

    const completedCount = await Enrollment.countDocuments({
        track: trackId,
        status: "completed"
    })

    const completionRate = totalEnrollments === 0 ? 0 : Math.floor((completedCount / totalEnrollments) * 100);

    const totalSubmissions = await Submission.countDocuments({
        task: { $in: taskIds }
    });

    const avgScoreResult = await Evaluation.aggregate([
        {
            $lookup: {
                from: "submissions",
                localField: "submission",
                foreignField: "_id",
                as: "submissionData"
            }
        },
        { 
            $unwind: "$submissionData"
        },
        {
            $match: {
                "submissionData.task": { $in: taskIds }
            }
        },
        {
            $group: {
                _id: null,
                averageScore: { $avg: "$score"}
            }
        }
    ]);

    const averageScore = avgScoreResult.length > 0 ? Number(avgScoreResult[0].averageScore.toFixed(2)) : 0;

    const difficultyResult = await Evaluation.aggregate([
        {
            $lookup: {
                from: "submissions",
                localField: "submission",
                foreignField: "_id",
                as: "submissionData"
            }
        },
        { 
            $unwind: "$submissionData"
        },
        {
            $match: {
                "submissionData.task": { $in: taskIds }
            }
        },
        {
            $group: {
                _id: "$submissionData.task",
                avgScore: { $avg: "$score"}
            }
        },
        {
            $sort: { avgScore: 1 }  
        },
        {
            $limit: 1
        }
    ]);

    let mostDifficultTask = null;

    if(difficultyResult.length > 0){
        const task = await Task.findById(difficultyResult[0]._id)
        mostDifficultTask = task?.question || null
    }

    return res
      .status(200)
      .json(new ApiResponse(
        200,
        {
            totalEnrollments,
            completionRate,
            totalSubmissions,
            averageScore,
            mostDifficultTask
        },
        "Track analytics fetched successfully."
      ));
})

export { 
    getTrackAnalytics,
}