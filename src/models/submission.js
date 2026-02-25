import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
    {
        task: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Task",
            required: true
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        answer: {
            type: String,
            required: true
        },
        attemptNumber: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            enum: ["pending", "processing", "evaluated", "failed"],
            default: "pending"
        },
        retryCount: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true}
);

submissionSchema.index({ user: 1, task: 1})

export const Submission = mongoose.model("Submission", submissionSchema);