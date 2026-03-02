import { Router } from "express";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

import {
    enrollInTrack,
    getEnrollmentStatus,
    unenrollFromTrack,
} from "../controllers/enrollment.controller.js";

const router = Router();

router.route("/:trackId/enroll")
    .post(verifyJWT, authorizeRoles("learner"), enrollInTrack)
    .delete(verifyJWT, authorizeRoles("learner"), unenrollFromTrack)

router.route("/:trackId/enrollment-status")
    .get(verifyJWT, getEnrollmentStatus)


export default router