import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

import { Task } from "../models/task.js";
import { Module } from "../models/module.js";
import { Track } from "../models/track.js";

const createTask = asyncHandler( async(req, res) => {
    const { moduleId } = req.params
    if(!moduleId){
        throw new ApiError(400, "ModuleID is required")
    }
    const { question, taskType, rubric, maxAttempts, isPublished, order  } = req.body
    if(!question || question.trim() === ""){
        throw new ApiError(400, "Question is required.")
    }

    const module = await Module.findById(moduleId)
    if(!module){
        throw new ApiError(404, "Module not found.")
    }

    const track = await Track.findById(module.track)
    if(!track){
        throw new ApiError(404, "Track not found.")
    }

    if(!track.createdBy.equals(req.user._id) &&
          req.user.role !== "admin"){
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



export {
    createTask,
}