import { Router } from "express";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

import {
    enrollInTrack,
} from "../controllers/enrollment.controller.js";

const router = Router();

router.route("/:trackId/enroll") 
    .post(verifyJWT, authorizeRoles("learner"), enrollInTrack)


export default router