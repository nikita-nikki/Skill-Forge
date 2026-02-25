import { Router } from "express";

import {
    evaluateSubmission,
    getEvaluationBySubmission,
    retryEvaluation
} from "../controllers/evaluation.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router()

router.route("/:submissionId/evaluate")
   .post(verifyJWT, authorizeRoles("mentor", "admin"), evaluateSubmission)

router.route("/:submissionId/evaluation")
    .get(verifyJWT, getEvaluationBySubmission)

router.route("/:submissionId/evaluation")
     .post(verifyJWT, authorizeRoles("mentor", "admin"), retryEvaluation)

export default router;