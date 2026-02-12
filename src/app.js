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

//routes declaration
app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/users", userRouter)



export {app}