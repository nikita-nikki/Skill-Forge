import { Router } from "express";

import {
   createTrack,
   getPublishedTracks,
   getMyTracks,
   togglePublishTrack,
   getEnrolledTracks,
} from "../controllers/track.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router()

router.route("/")
   .get(getPublishedTracks)
   .post(verifyJWT, authorizeRoles("mentor", "admin"), createTrack)

router.route("/my")
   .get(verifyJWT, authorizeRoles("mentor", "admin"), getMyTracks)

router.route("/enrolled")
   .get(verifyJWT, authorizeRoles("learner"), getEnrolledTracks)

router.route("/toggle/publish/:trackId")
   .patch(verifyJWT, authorizeRoles("mentor", "admin"), togglePublishTrack)

export default router