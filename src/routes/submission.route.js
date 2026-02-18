import { Router } from "express";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

import {
    submitTask,
} from "../controllers/submission.controller.js";

const router = Router()

router.route("/:taskId/submit")
   .post(verifyJWT, authorizeRoles("learner", "admin"), submitTask)


export default router