import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

import { Task } from "../models/task.js";
import { Module } from "../models/module.js";
import { Track } from "../models/track.js";

const createTask = asyncHandler(async (req, res) => {
    const { moduleId } = req.params
    if (!moduleId) {
        throw new ApiError(400, "ModuleID is required")
    }
    const { question, taskType, rubric, maxAttempts, isPublished, order } = req.body
    if (!question || question.trim() === "") {
        throw new ApiError(400, "Question is required.")
    }

    const module = await Module.findById(moduleId)
    if (!module) {
        throw new ApiError(404, "Module not found.")
    }

    const track = await Track.findById(module.track)
    if (!track) {
        throw new ApiError(404, "Track not found.")
    }

    if (!track.createdBy.equals(req.user._id) &&
        req.user.role !== "admin") {
        throw new ApiError(403, "You are not allowed to create task.")
    }

    const task = await Task.create({
        module: moduleId,
        question,
        rubric,
        taskType,
        maxAttempts,
        isPublished,
        order
    })

    return res
        .status(201)
        .json(new ApiResponse(
            201,
            task,
            "Task created successfully."
        ))

})

const getTasksByModule = asyncHandler(async (req, res) => {
    const { moduleId } = req.params;
    if (!moduleId) {
        throw new ApiError(400, "ModuleID is required");
    }

    const module = await Module.findById(moduleId);
    if (!module) {
        throw new ApiError(404, "Module not found.");
    }

    const tasks = await Task.find({ module: moduleId, isPublished: true }).sort({ order: 1 });

    return res.status(200).json(
        new ApiResponse(200, tasks, "Tasks fetched successfully.")
    );
});

const updateTask = asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
        throw new ApiError(400, "Valid TaskID is required.");
    }

    const { question, taskType, rubric, maxAttempts, isPublished, order } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
        throw new ApiError(404, "Task not found.");
    }

    const module = await Module.findById(task.module);
    if (!module) {
        throw new ApiError(404, "Module not found.");
    }

    const track = await Track.findById(module.track);
    if (!track || (!track.createdBy.equals(req.user._id) && req.user.role !== "admin")) {
        throw new ApiError(403, "You are not allowed to update this task.");
    }

    if (question !== undefined) task.question = question;
    if (taskType !== undefined) task.taskType = taskType;
    if (rubric !== undefined) task.rubric = rubric;
    if (maxAttempts !== undefined) task.maxAttempts = maxAttempts;
    if (isPublished !== undefined) task.isPublished = isPublished;
    if (order !== undefined) task.order = order;

    await task.save();

    return res.status(200).json(
        new ApiResponse(200, task, "Task updated successfully.")
    );
});

export {
    createTask,
    getTasksByModule,
    updateTask
}