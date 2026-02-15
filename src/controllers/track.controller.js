import { Track } from "../models/track.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

const createTrack = asyncHandler( async(req, res) => {

    const { title, description, difficulty, isPublished, tags } = req.body
    if(!title || !description){
        throw new ApiError(400, "Title and description both required.")
    }
    if(title.trim() === "" || description.trim() === ""){
        throw new ApiError(400, "Title and description cannot be empty.")
    }

    const track = await Track.create({
        title,
        description,
        difficulty,
        isPublished,
        tags,
        createdBy: req.user._id
    });

    return res
      .status(201)
      .json( new ApiResponse(
        201,
        track,
        "Track created successfully."
      ))
});

const getPublishedTracks = asyncHandler( async(req, res) => {
    // const track = await Track.find({ isPublished: true}).populate("createdBy", "name email").sort({createdAt: -1});

    const tracks = await Track.aggregate([
        {
            $match: {isPublished: true}
        },
        {
            $lookup: {
                from: "users",
                localField: "createdBy",
                foreignField: "_id",
                as: "track_owner"
            }
        },
        {
            $unwind: "$track_owner"
        },
        {
            $project: {
                title: 1,
                description: 1,
                difficulty: 1,
                "track_owner.name": 1,
                "track_owner.role": 1 
            }
        },
        {
            $sort: {
                createdAt : -1
            }
        },
    ])

    return res
      .status(200)
      .json(new ApiResponse(
        200,
        tracks,
        "All published trackes fetched successfully."
      ))
});

const getMyTracks = asyncHandler( async(req, res) => {

    const tracks = await Track.find({ createdBy: req.user._id}).sort({ createdAt: -1})

    return res
      .status(200)
      .json(new ApiResponse(
        200,
        tracks,
        "Your tracks fetched successfully."
      ))

});

const togglePublishTrack = asyncHandler( async(req, res) => {

    const { trackId } = req.params
    if(!trackId){
        throw new ApiError(400, "trackId is required.")
    }
    if(!mongoose.Types.ObjectId.isValid(trackId)){
        throw new ApiError(401, "trackId is not valid.")
    }

    const track = await Track.findById(trackId);

    //ownership checking
    if(!track.createdBy.equals(req.user._id)){
        throw new ApiError(403, "Your not allowed to toggle this.")
    }

    track.isPublished = !track.isPublished
    const updatedTrack = await track.save({  validateBeforeSave: false })

    return res
      .status(200)
      .json(new ApiResponse(
        200,
        updatedTrack,
        "Track publish status toggled successfully."
      ))
})

export {
    createTrack,
    getPublishedTracks,
    getMyTracks,
    togglePublishTrack,
}