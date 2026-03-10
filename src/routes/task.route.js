import { Router } from "express";

import {
    createTask,
    getTasksByModule,
    updateTask
} from "../controllers/task.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router()

router.route("/:moduleId/tasks")
    .get(verifyJWT, getTasksByModule)
    .post(verifyJWT, authorizeRoles("admin", "mentor"), createTask)

router.route("/:taskId")
    .patch(verifyJWT, authorizeRoles("admin", "mentor"), updateTask)

export default router