import mongoose from "mongoose";

const evaluationSchema = new mongoose.Schema(
    {
        submission: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Submission",
            required: true,
            unique: true
        },
        score: {
            type: Number,
            required: true
        },
        breakdown: {
            clarity: Number,
            correctness: Number,
            examples: Number,
        },
        feedback: {
            type: String
        }
    },
    { timestamps: true}
);

export const Evaluation = mongoose.model("Evaluation", evaluationSchema);