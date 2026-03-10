import { Router } from "express";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

import {
    submitTask,
    getSubmissionsByTrack,
} from "../controllers/submission.controller.js";

const router = Router()

router.route("/:taskId/submit")
    .post(verifyJWT, authorizeRoles("learner", "admin"), submitTask)

router.route("/track/:trackId")
    .get(verifyJWT, authorizeRoles("mentor", "admin"), getSubmissionsByTrack)


export default router