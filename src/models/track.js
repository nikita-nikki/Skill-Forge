import mongoose from "mongoose";

const trackSchema = mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },
        description: {
            type: String,
            required: true,
            maxlength: 1000
        },
        difficulty: {
            type: String,
            enum: ["beginner", "intermediate", "advanced"],
            default: "beginner"
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        isPublished: {
            type: Boolean,
            default: false,
        },
        tags: [
            {
                type: String,
                trim: true
            }
        ],
    },
    { timestamps: true}
);


trackSchema.index({ createdBy: 1});
trackSchema.index({ isPublished: 1});

export const Track = mongoose.model("Track", trackSchema);