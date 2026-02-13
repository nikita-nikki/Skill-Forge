import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import {
    adminTest,
    mentorTest,
    learnerTest
} from "../controllers/testRole.controller.js"

const router = Router()

router.route("/admin-test").get(verifyJWT, authorizeRoles("admin"), adminTest)
router.route("/mentor-test").get(verifyJWT, authorizeRoles("mentor"), mentorTest)
router.route("/learner-test").get(verifyJWT, authorizeRoles("learner"), learnerTest)

export default router