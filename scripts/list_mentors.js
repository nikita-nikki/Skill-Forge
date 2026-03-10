import mongoose from "mongoose";
import { User } from "../src/models/user.js";
import dotenv from "dotenv";
dotenv.config();

const run = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    const mentors = await User.find({ role: "mentor" }).select("name email").lean();
    console.log("All mentors:", JSON.stringify(mentors, null, 2));
    await mongoose.disconnect();
    process.exit(0);
};

run().catch(console.error);
