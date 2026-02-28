import { Worker } from "bullmq";
import IORedis from "ioredis";

import { Submission } from "../models/submission.js";
import { Task } from "../models/task.js";
import { Evaluation } from "../models/evaluation.js";
import { Module } from "../models/module.js";
import { Track } from "../models/track.js";
import { Enrollment } from "../models/enrollment.js";

const connection = new IORedis({
  maxRetriesPerRequest: null,
});

const evaluationWorker = new Worker(
    "evaluationQueue",
    async (job) => {
        const { submissionId } = job.data;

        const submission = await Submission.findById(submissionId)
        if(!submission) return;

        const task = await Task.findById(submission.task)
        if(!task) return;

        const rubric = task.rubric || {};

        const breakdown = {
            clarity: Math.floor(Math.random() * ((rubric.clarity || 0) + 1)),
            correctness: Math.floor(Math.random() * ((rubric.correctness || 0) + 1)),
            examples: Math.floor(Math.random() * ((rubric.examples || 0) + 1)),
        };

        const totalScore = breakdown.clarity + breakdown.correctness + breakdown.examples;

        await Evaluation.create({
            submission: submission._id,
            score: totalScore,
            breakdown,
            feedback: "AI simulated via worker."
        });

        submission.status = "evaluated"
        await submission.save();
        
        const module = await Module.findById(task.module)
        if(!module) return;

        const track = await Track.findById(module.track)
        if(!track) return;

        const moduleIds = await Module.find({ track: track._id }).distinct("_id")

        const totalTasks = await Task.countDocuments({
            module: {$in: moduleIds}
        });

        const completedTasks = await Submission.distinct( "task", {
            user: submission.user,
            status: "evaluated"
        })

        const progress = totalTasks === 0 ? 0 : Math.floor((completedTasks.length / totalTasks) * 100 );

        const newStatus = progress === 100 ? "completed" : "active";

        await Enrollment.findOneAndUpdate(
            { user: submission.user, track: track._id},
            { 
                progressPercentage: progress,
                status: newStatus
            }
        ); 
    },
    { connection }
);

export {
    evaluationWorker
}