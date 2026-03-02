import { Router } from "express";

import {
    createTask,
    getTasksByModule,
} from "../controllers/task.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router()

router.route("/:moduleId/tasks")
    .get(verifyJWT, getTasksByModule)
    .post(verifyJWT, authorizeRoles("admin", "mentor"), createTask)


export default router