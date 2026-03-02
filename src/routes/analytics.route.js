import { Router } from "express";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

import {
    getTrackAnalytics,
    getMyPerformance,
    getAllStudentPerformance
} from "../controllers/analytics.controller.js";

const router = Router();

router.route("/tracks/:trackId/analytics")
    .get(verifyJWT, authorizeRoles("mentor", "admin"), getTrackAnalytics)

router.route("/my-performance")
    .get(verifyJWT, authorizeRoles("learner"), getMyPerformance)

router.route("/students")
    .get(verifyJWT, authorizeRoles("admin"), getAllStudentPerformance)

export default router;