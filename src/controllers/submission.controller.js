import { Submission } from "../models/submission.js";
import { Task } from "../models/task.js";
import { Module } from "../models/module.js";
import { Track } from "../models/track.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const submitTask  = asyncHandler( async(req, res) => {
    const { taskId } = req.params
    if(!taskId){
        throw new ApiError(400, "TrackId is required.")
    }
    
    const { answer } = req.body
    if(!answer || answer.trim() === ""){
        throw new ApiError(400, "Answer is required.")
    }

    const task = await Task.findById(taskId)
    if(!task){
        throw new ApiError(404, "Task not found.")
    }
    if(!task.isPublished){
        throw new ApiError(400, "Cannot submit to unpublished task.")
    }

    const module = await Module.findById(task.module)
    if(!module){
        throw new ApiError(404, "Module not found.")
    }
    if(!module.isPublished){
        throw new ApiError(400, "Cannot submit to unpublished module.")
    }

    const track= await Track.findById(module.track)
    if(!track){
        throw new ApiError(404, "Track not found.")
    }
    if(!track.isPublished){
        throw new ApiError(400, "Cannot submit to unpublished track.")
    } 

    const attempCount = await Submission.countDocuments({
        user: req.user._id,
        task: taskId
    })

    if(attempCount >= task.maxAttempts){
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


export {
    submitTask,
}