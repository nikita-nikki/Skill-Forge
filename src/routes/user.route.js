import { Router } from "express";
import {
    registerUser,
    loginUSer,
    logoutUser,
    refreshAccessAndRefreshToken,
    getAllStudents,
    getAllMentors,
    applyForMentor,
    getMentorApplications,
    approveMentorApplication,
    rejectMentorApplication
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router()

router.route("/register").post(registerUser)
router.route("/login").post(loginUSer)

//secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessAndRefreshToken)
router.route("/apply-mentor").post(verifyJWT, authorizeRoles("learner"), applyForMentor)

//admin specific routes
router.route("/students").get(verifyJWT, authorizeRoles("admin"), getAllStudents);
router.route("/mentors").get(verifyJWT, authorizeRoles("admin"), getAllMentors);
router.route("/applications").get(verifyJWT, authorizeRoles("admin"), getMentorApplications);
router.route("/applications/:userId/approve").post(verifyJWT, authorizeRoles("admin"), approveMentorApplication);
router.route("/applications/:userId/reject").post(verifyJWT, authorizeRoles("admin"), rejectMentorApplication);

export default router