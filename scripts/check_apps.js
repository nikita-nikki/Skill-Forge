import mongoose from "mongoose";
import { User } from "../src/models/user.js";
import dotenv from "dotenv";
dotenv.config();

const run = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    const users = await User.find({ mentorApplicationStatus: 'pending' });
    console.log("Pending applications:", users.length);
    console.log(users);

    // Also let me check if there are users with status 'none' who want to be mentors but failed
    const all = await User.find({});
    console.log("All learners:", all.filter(u => u.role === 'learner').map(u => ({ email: u.email, status: u.mentorApplicationStatus })));
    process.exit(0);
}
run();
