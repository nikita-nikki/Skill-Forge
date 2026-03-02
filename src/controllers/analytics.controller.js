import { Track } from "../models/track.js";
import { Module } from "../models/module.js";
import { Task } from "../models/task.js";
import { Submission } from "../models/submission.js";
import { Enrollment } from "../models/enrollment.js";
import { Evaluation } from "../models/evaluation.js";

import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getTrackAnalytics = asyncHandler(async (req, res) => {
    const { trackId } = req.params
    const track = await Track.findById(trackId)
    if (!track) {
        throw new ApiError(404, "Track not found.")
    }

    if (
        req.user.role === "mentor" &&
        !track.createdBy.equals(req.user._id)
    ) {
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
                averageScore: { $avg: "$score" }
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
                avgScore: { $avg: "$score" }
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

    if (difficultyResult.length > 0) {
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

const getMyPerformance = asyncHandler(async (req, res) => {
    // 1. Total Submissions (All, regardless of status)
    const totalSubmissions = await Submission.countDocuments({ user: req.user._id });

    // 2. Performance grouped by Track
    // Using aggregation to get tracks, tasks and their scores in one go
    const trackWisePerformance = await Submission.aggregate([
        {
            $match: { user: req.user._id, status: "evaluated" }
        },
        {
            $lookup: {
                from: "evaluations",
                localField: "_id",
                foreignField: "submission",
                as: "evaluation"
            }
        },
        { $unwind: "$evaluation" },
        {
            $lookup: {
                from: "tasks",
                localField: "task",
                foreignField: "_id",
                as: "taskInfo"
            }
        },
        { $unwind: "$taskInfo" },
        {
            $lookup: {
                from: "modules",
                localField: "taskInfo.module",
                foreignField: "_id",
                as: "moduleInfo"
            }
        },
        { $unwind: "$moduleInfo" },
        {
            $lookup: {
                from: "tracks",
                localField: "moduleInfo.track",
                foreignField: "_id",
                as: "trackInfo"
            }
        },
        { $unwind: "$trackInfo" },
        {
            $group: {
                _id: "$trackInfo._id",
                trackTitle: { $first: "$trackInfo.title" },
                tasks: {
                    $push: {
                        taskId: "$taskInfo._id",
                        taskQuestion: "$taskInfo.question",
                        score: "$evaluation.score",
                        evaluatedAt: "$evaluation.createdAt"
                    }
                },
                avgScore: { $avg: "$evaluation.score" },
                totalTasksEvaluated: { $sum: 1 }
            }
        },
        { $sort: { trackTitle: 1 } }
    ]);

    // 3. Overall Aggregate Stats
    const totalEvaluated = trackWisePerformance.reduce((acc, curr) => acc + curr.totalTasksEvaluated, 0);
    const sumScores = trackWisePerformance.reduce((acc, curr) => acc + (curr.avgScore * curr.totalTasksEvaluated), 0);
    const averageScore = totalEvaluated > 0 ? (sumScores / totalEvaluated).toFixed(2) : 0;

    return res.status(200).json(new ApiResponse(
        200,
        {
            overall: {
                totalSubmissions,
                totalEvaluated,
                averageScore: Number(averageScore)
            },
            trackWise: trackWisePerformance
        },
        "Performance fetched successfully."
    ));
});

const getAllStudentPerformance = asyncHandler(async (req, res) => {
    // A bird's-eye view of all student performance (overall average across system)
    const stats = await Evaluation.aggregate([
        {
            $lookup: {
                from: "submissions",
                localField: "submission",
                foreignField: "_id",
                as: "submissionData"
            }
        },
        { $unwind: "$submissionData" },
        {
            $group: {
                _id: "$submissionData.user",
                averageScore: { $avg: "$score" },
                evaluatedTasks: { $sum: 1 }
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "studentInfo"
            }
        },
        { $unwind: "$studentInfo" },
        {
            $project: {
                _id: 1,
                averageScore: { $round: ["$averageScore", 2] },
                evaluatedTasks: 1,
                "studentInfo.name": 1,
                "studentInfo.email": 1
            }
        }
    ]);

    return res.status(200).json(new ApiResponse(
        200,
        stats,
        "All student performances fetched successfully."
    ));
});

export {
    getTrackAnalytics,
    getMyPerformance,
    getAllStudentPerformance
}