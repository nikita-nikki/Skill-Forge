import mongoose from "mongoose";

const moduleSchema = mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },
        description: {
            type: String,
            trim: true,
            maxlength: 1000
        },
        track: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Track",
            required: true
        },
        order: {
            type: Number,
            required: true,
            min: 1,
        },
        isPublished: {
            type: Boolean,
            default: true
        },
    },
    { timestamps: true}
);

moduleSchema.index(({ track: 1}));
moduleSchema.index({ track: 1, order: 1 }, { unique: true });

export const Module = mongoose.model("Module", moduleSchema);