import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const healthCheck = asyncHandler(async(req, res) => {
    return res
      .status(200)
      .json({
        status: "OK",
        message: "SkillForge backend is running"
      }) 
})

export { healthCheck }