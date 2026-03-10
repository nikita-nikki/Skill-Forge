// Dummy Queue bypassing BullMQ/Redis for the demo
import { geminiModel } from "../config/gemini.js";
import { Submission } from "../models/submission.js";
import { Task } from "../models/task.js";
import { Evaluation } from "../models/evaluation.js";
import { Module } from "../models/module.js";
import { Track } from "../models/track.js";
import { Enrollment } from "../models/enrollment.js";

async function processEvaluationWorker(submissionId) {
    console.log("Worker started job:", submissionId);

    const submission = await Submission.findById(submissionId);
    if (!submission) return;

    const task = await Task.findById(submission.task);
    if (!task) return;

    const rubric = task.rubric || {};

    try {
        const prompt = `
        You are an evaluator.
        Evaluate the student's answer strictly using the rubric below.
        Return ONLY valid JSON.
        
        Question:
        ${task.question}

        Student Answer:
        ${submission.answer}

        Rubric:
        Clarity: ${rubric.clarity}
        Correctness: ${rubric.correctness}
        Examples: ${rubric.examples}

        Return JSON format:
        {
          "clarity": number,
          "correctness": number,
          "examples": number,
          "feedback": string
        }
        `;
        
        const result = await geminiModel.generateContent(prompt);
        const text = result.response.text();
        const cleaned = text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleaned);

        const breakdown = {
            clarity: parsed.clarity,
            correctness: parsed.correctness,
            examples: parsed.examples,
        };

        const totalScore = breakdown.clarity + breakdown.correctness + breakdown.examples;

        await Evaluation.create({
            submission: submission._id,
            score: totalScore,
            breakdown,
            feedback: parsed.feedback,
        });

        submission.status = "evaluated";
        await submission.save();

    } catch (error) {
        console.log("Gemini evaluation failed: ", error);
        submission.status = "failed";
        submission.retryCount += 1;
        await submission.save();
        throw error; 
    }

    const module = await Module.findById(task.module);
    if (!module) return;

    const track = await Track.findById(module.track);
    if (!track) return;

    const moduleIds = await Module.find({ track: track._id }).distinct("_id");
    const totalTasks = await Task.countDocuments({ module: { $in: moduleIds } });
    const completedTasks = await Submission.distinct("task", { user: submission.user, status: "evaluated" });
    const progress = totalTasks === 0 ? 0 : Math.floor((completedTasks.length / totalTasks) * 100);
    const newStatus = progress === 100 ? "completed" : "active";

    await Enrollment.findOneAndUpdate(
        { user: submission.user, track: track._id },
        { progressPercentage: progress, status: newStatus }
    );
}

class DummyQueue {
    constructor(name) {
        this.name = name;
    }
    async add(name, data) {
        console.log(`[DummyQueue] Added job ${name} for submissionId: ${data.submissionId}`);
        // Run in background without awaiting so API responds immediately
        processEvaluationWorker(data.submissionId).catch(err => {
            console.error("[DummyQueue] processing error:", err);
        });
        return { id: Date.now() };
    }
}

export const evaluationQueue = new DummyQueue("evaluationQueue");