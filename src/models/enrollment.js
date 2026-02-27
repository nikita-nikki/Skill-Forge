import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        track: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Track",
            required: true
        },
        progressPercentage: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        status: {
            type: String,
            enum: ["active", "completed"],
            default: "active"
        },
    },
    { timestamps: true}
)

enrollmentSchema.index({ user: 1, track: 1 }, {unique: true });

export const Enrollment = mongoose.model("Enrollment", enrollmentSchema);