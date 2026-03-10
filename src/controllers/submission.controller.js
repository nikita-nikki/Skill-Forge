import { Submission } from "../models/submission.js";
import { Task } from "../models/task.js";
import { Module } from "../models/module.js";
import { Track } from "../models/track.js";
import { Enrollment } from "../models/enrollment.js";
import { Evaluation } from "../models/evaluation.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const submitTask = asyncHandler(async (req, res) => {
    const { taskId } = req.params
    if (!taskId) {
        throw new ApiError(400, "TrackId is required.")
    }

    const { answer } = req.body
    if (!answer || answer.trim() === "") {
        throw new ApiError(400, "Answer is required.")
    }

    const task = await Task.findById(taskId)
    if (!task) {
        throw new ApiError(404, "Task not found.")
    }
    if (!task.isPublished) {
        throw new ApiError(400, "Cannot submit to unpublished task.")
    }

    const module = await Module.findById(task.module)
    if (!module) {
        throw new ApiError(404, "Module not found.")
    }
    if (!module.isPublished) {
        throw new ApiError(400, "Cannot submit to unpublished module.")
    }

    const track = await Track.findById(module.track)
    if (!track) {
        throw new ApiError(404, "Track not found.")
    }
    if (!track.isPublished) {
        throw new ApiError(400, "Cannot submit to unpublished track.")
    }

    const enrollment = await Enrollment.findOne({
        user: req.user._id,
        track: track._id
    });
    if (!enrollment) {
        throw new ApiError(403, "You must enroll in this track to submit tasks.")
    }

    const attempCount = await Submission.countDocuments({
        user: req.user._id,
        task: taskId
    })

    if (attempCount >= task.maxAttempts) {
        throw new ApiError(403, `Maximum attempts (${task.maxAttempts}) reached.`)
    }

    const submission = await Submission.create({
        user: req.user._id,
        task: taskId,
        answer,
        attemptNumber: attempCount + 1,
    })

    return res
        .status(201)
        .json(new ApiResponse(
            201,
            submission,
            "Submission successfull."
        ))

})

const getSubmissionsByTrack = asyncHandler(async (req, res) => {
    const { trackId } = req.params;

    const track = await Track.findById(trackId);
    if (!track) {
        throw new ApiError(404, "Track not found.");
    }

    // Only the track owner (mentor) or admin can view submissions
    if (req.user.role === "mentor" && !track.createdBy.equals(req.user._id)) {
        throw new ApiError(403, "Not authorized to view submissions for this track.");
    }

    // Get all module IDs for this track
    const moduleIds = await Module.find({ track: trackId }).distinct("_id");

    // Get all task IDs for those modules
    const taskIds = await Task.find({ module: { $in: moduleIds } }).distinct("_id");

    // Fetch all submissions for those tasks, with learner name and task question
    const submissions = await Submission.find({ task: { $in: taskIds } })
        .populate("user", "name email")
        .populate("task", "question rubric")
        .sort({ createdAt: -1 })
        .lean();

    // Attach evaluation data (score, feedback) to each submission
    const submissionIds = submissions.map(s => s._id);
    const evaluations = await Evaluation.find({ submission: { $in: submissionIds } }).lean();
    const evalMap = {};
    evaluations.forEach(ev => { evalMap[ev.submission.toString()] = ev; });

    const enriched = submissions.map(sub => ({
        ...sub,
        evaluation: evalMap[sub._id.toString()] || null,
    }));

    return res
        .status(200)
        .json(new ApiResponse(200, enriched, "Submissions fetched successfully."));
});


export {
    submitTask,
    getSubmissionsByTrack,
}