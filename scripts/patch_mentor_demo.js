import mongoose from "mongoose";
import { User } from "../src/models/user.js";
import dotenv from "dotenv";
dotenv.config();

const run = async () => {
    await mongoose.connect(process.env.MONGODB_URI);

    // Find the first mentor account
    const mentor = await User.findOne({ role: "mentor" });
    if (!mentor) {
        console.log("No mentor found.");
        process.exit(1);
    }

    console.log("Found mentor:", mentor.email);

    // Set a known password
    mentor.password = "mentor123";
    await mentor.save();

    console.log("Password set to: mentor123");
    await mongoose.disconnect();
    process.exit(0);
};

run().catch(console.error);
