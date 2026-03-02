import mongoose from "mongoose";
import { User } from "../src/models/user.js";
import dotenv from "dotenv";

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        const adminEmail = "admin@sf.com";
        const adminPassword = "adminpassword";

        const existingAdmin = await User.findOne({ email: adminEmail });
        if (existingAdmin) {
            console.log("Admin already exists. Updating role...");
            existingAdmin.role = "admin";
            await existingAdmin.save({ validateBeforeSave: false });
            console.log("Admin updated.");
        } else {
            await User.create({
                name: "Admin User",
                email: adminEmail,
                password: adminPassword,
                role: "admin"
            });
            console.log("Admin created successfully.");
            console.log(`Email: ${adminEmail}`);
            console.log(`Password: ${adminPassword}`);
        }

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error("Error seeding admin:", error);
        process.exit(1);
    }
};

seedAdmin();
