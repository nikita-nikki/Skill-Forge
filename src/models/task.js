import mongoose from "mongoose";

const taskSchema = mongoose.Schema(
    {
        module: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Module",
            required: true
        },
        question: {
            type: String,
            required: true,
            maxlength: 2000,
        },
        rubric: {
            clarity: { type: Number, default: 0 },
            correctness: { type: Number, default: 0 },
            examples: { type: Number, default: 0}
        },
        taskType: {
            type: String,
            enum: ["text", "code"],
            default: "text"
        },
        maxAttempts: {
            type: Number,
            default: 3,
            min: 1
        },
        isPublished: {
            type: Boolean,
            default: true
        },
        order: {
            type: Number,
            required: true,
        }
    },
    { timestamps: true}
)


taskSchema.index({ module:1, oder: 1}, { unique: true});

export const Task = mongoose.model("Task", taskSchema);