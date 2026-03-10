import mongoose from "mongoose";
import { User } from "../src/models/user.js";
import dotenv from "dotenv";
dotenv.config();

const run = async () => {
    await mongoose.connect(process.env.MONGODB_URI);

    // Delete demo mentor if exists
    await User.deleteOne({ email: "demomt@sf.com" });

    // Create fresh mentor with known credentials
    const mentor = await User.create({
        name: "demomentor",
        email: "demomt@sf.com",
        password: "demo1234",
        role: "mentor",
    });

    console.log("Created demo mentor:");
    console.log("  Email: demomt@sf.com");
    console.log("  Password: demo1234");
    console.log("  Role:", mentor.role);

    await mongoose.disconnect();
    process.exit(0);
};

run().catch(console.error);
