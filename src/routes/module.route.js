import { Router } from "express";

import {
    createModule,
    getModuleByTrack,
} from "../controllers/module.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router()

router.route("/:trackId/modules")
      .get(getModuleByTrack)
      .post(verifyJWT, authorizeRoles("mentor", "admin"), createModule)



export default router