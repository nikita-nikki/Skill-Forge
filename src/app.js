import express from "express";
import cors from "cors"

const app = express()

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))

app.get("/health",(req,res)=>{
    return res
      .status(200)
      .json({
        status: "OK",
        message: "SkillForge backend is running"
      })
})

export {app}