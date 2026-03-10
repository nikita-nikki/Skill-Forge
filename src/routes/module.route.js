import { Router } from "express";

import {
    createModule,
    getModuleByTrack,
    updateModule
} from "../controllers/module.controller.js";

import { verifyJWT, optionalVerifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router()

router.route("/:trackId/modules")
    .get(optionalVerifyJWT, getModuleByTrack)
    .post(verifyJWT, authorizeRoles("mentor", "admin"), createModule)

router.route("/:moduleId")
    .patch(verifyJWT, authorizeRoles("mentor", "admin"), updateModule)

export default router