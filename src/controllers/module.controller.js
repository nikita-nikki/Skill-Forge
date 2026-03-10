import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

import { Module } from "../models/module.js";
import { Track } from "../models/track.js";

import mongoose from "mongoose";

const createModule = asyncHandler(async (req, res) => {

    const { trackId } = req.params
    if (!trackId) {
        throw new ApiError(400, "TrackID is required.")
    }
    if (!mongoose.Types.ObjectId.isValid(trackId)) {
        throw new ApiError(400, "trackId is not valid.")
    }

    const { title, description, order, isPublished } = req.body
    if (!title || !order) {
        throw new ApiError(400, "Title and order required.")
    }

    const track = await Track.findById(trackId)
    if (!track) {
        throw new ApiError(404, "Track not found.")
    }
    //ownership checking
    if (!track.createdBy.equals(req.user._id)) {
        throw new ApiError(403, "You are not allowed to add modules to this track.")
    }

    const module = await Module.create({
        title,
        description,
        order,
        isPublished,
        track: trackId,
    });

    return res
        .status(201)
        .json(new ApiResponse(
            200,
            module,
            "Module created successfully."
        ))
})

const getModuleByTrack = asyncHandler(async (req, res) => {
    const { trackId } = req.params
    if (!trackId) {
        throw new ApiError(400, "TrackId is required.")
    }
    if (!mongoose.Types.ObjectId.isValid(trackId)) {
        throw new ApiError(400, "TrackId is not valid.")
    }

    const track = await Track.findById(trackId)
    if (!track) {
        throw new ApiError(404, "Track not found.")
    }

    //published or not
    if (!track.isPublished &&
        (!req.user ||
            (!track.createdBy.equals(req.user._id) &&
                req.user.role !== "admin"))
    ) {
        throw new ApiError(403, "This track is no publicly accessible.")
    }

    const modules = await Module.find({ track: trackId }).sort({ order: 1 });

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            modules,
            "Modules fecthed successfully."
        ));
})

const updateModule = asyncHandler(async (req, res) => {
    const { moduleId } = req.params;
    if (!moduleId || !mongoose.Types.ObjectId.isValid(moduleId)) {
        throw new ApiError(400, "Valid ModuleID is required.");
    }

    const { title, description, order, isPublished } = req.body;

    const module = await Module.findById(moduleId);
    if (!module) {
        throw new ApiError(404, "Module not found.");
    }

    const track = await Track.findById(module.track);
    //ownership checking
    if (!track || !track.createdBy.equals(req.user._id)) {
        throw new ApiError(403, "You are not allowed to update this module.");
    }

    if (title !== undefined) module.title = title;
    if (description !== undefined) module.description = description;
    if (order !== undefined) module.order = order;
    if (isPublished !== undefined) module.isPublished = isPublished;

    await module.save();

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            module,
            "Module updated successfully."
        ));
});

export {
    createModule,
    getModuleByTrack,
    updateModule
}