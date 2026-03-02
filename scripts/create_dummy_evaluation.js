import mongoose from "mongoose";
import { Submission } from "../src/models/submission.js";
import { Evaluation } from "../src/models/evaluation.js";
import dotenv from "dotenv";

dotenv.config();

const createDummyEvaluation = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        const submission = await Submission.findOne({ status: "pending" }).sort({ createdAt: -1 });
        if (!submission) {
            console.log("No pending submission found");
            return;
        }

        const evaluation = await Evaluation.create({
            submission: submission._id,
            score: 8,
            feedback: "Great job!",
            breakdown: { clarity: 9, correctness: 8, examples: 7 }
        });

        submission.status = "evaluated";
        await submission.save();

        console.log("Created evaluation:", evaluation._id);
        console.log("Updated submission:", submission._id);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

createDummyEvaluation();
