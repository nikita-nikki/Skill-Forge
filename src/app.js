import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";

const app = express()

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(cookieParser())

//routes import
import healthcheckRouter from "./routes/healthcheck.route.js"
import userRouter from "./routes/user.route.js"
import testRoleRouter from "./routes/testRole.route.js"
import trackRouter from "./routes/track.route.js"
import moduleRouter from "./routes/module.route.js"
import taskRouter from "./routes/task.route.js"
import submissionRouter from "./routes/submission.route.js"
import evaluationRouter from "./routes/evaluation.route.js"

//routes declaration
app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/users", userRouter)
app.use("/api/v1/test-role", testRoleRouter)
app.use("/api/v1/tracks", trackRouter)
app.use("/api/v1/tracks", moduleRouter)
app.use("/api/v1/modules", taskRouter)
app.use("/api/v1/tasks", submissionRouter)
app.use("/api/v1/submissions", evaluationRouter)




export {app}