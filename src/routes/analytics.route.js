import { Router } from "express";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

import {
    getTrackAnalytics,
} from "../controllers/analytics.controller.js";

const router = Router();

router.route("/tracks/:trackId/analytics")
   .get(verifyJWT, authorizeRoles("mentor", "admin"), getTrackAnalytics)


export default router;