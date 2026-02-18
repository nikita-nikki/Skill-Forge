import { Router } from "express";

import {
    createTask,
} from "../controllers/task.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router()

router.route("/:moduleId/tasks")
      .post(verifyJWT, authorizeRoles("admin", "mentor"), createTask)


export default router