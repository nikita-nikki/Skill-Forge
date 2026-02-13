import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

export const adminTest = asyncHandler( async (req, res) => {
    return res
      .status(200)
      .json( new ApiResponse(
        200,
        { user: req.user},
        "Admin access granted"
      ))
})


export const mentorTest = asyncHandler(async(req, res) => {
    return res
      .status(200)
      .json( new ApiResponse(
        200,
        { user: req.user},
        "Mentor access granted"
      ))
})

export const learnerTest = asyncHandler( async(req, res) => {
    return res
      .status(200)
      .json( new ApiResponse(
        200,
        { user: req.user},
        "Learner access granted"
      ))
})