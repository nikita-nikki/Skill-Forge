import { Enrollment } from "../models/enrollment.js";
import { Track } from "../models/track.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const enrollInTrack = asyncHandler(async (req, res) => {
    const { trackId } = req.params;

    const track = await Track.findById(trackId)
    if (!track) {
        throw new ApiError(404, "Track not found.")
    }
    if (!track.isPublished) {
        throw new ApiError(403, "Cannot enroll in unpublished track.");
    }

    const existing = await Enrollment.findOne({
        user: req.user._id,
        track: trackId
    })
    if (existing) {
        throw new ApiError(400, "Already enrolled in this track.")
    }

    const enrollment = await Enrollment.create({
        user: req.user._id,
        track: trackId
    })

    return res
        .status(201)
        .json(new ApiResponse(
            201,
            enrollment,
            "Enrollement successfull."
        ))
})
const getEnrollmentStatus = asyncHandler(async (req, res) => {
    const { trackId } = req.params;

    const enrollment = await Enrollment.findOne({
        user: req.user._id,
        track: trackId
    });

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {
                isEnrolled: !!enrollment,
                progressPercentage: enrollment ? enrollment.progressPercentage : 0,
                status: enrollment ? enrollment.status : null,
                enrolledAt: enrollment ? enrollment.createdAt : null,
            },
            "Enrollment status fetched."
        ));
});

const unenrollFromTrack = asyncHandler(async (req, res) => {
    const { trackId } = req.params;

    const enrollment = await Enrollment.findOneAndDelete({
        user: req.user._id,
        track: trackId
    });

    if (!enrollment) {
        throw new ApiError(400, "You are not enrolled in this track.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Successfully unenrolled."));
});


export {
    enrollInTrack,
    getEnrollmentStatus,
    unenrollFromTrack,
}