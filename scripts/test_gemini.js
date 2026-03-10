import dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";

const run = async () => {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const result = await model.generateContent("Say hello!");
        console.log("Success:", result.response.text());
    } catch (err) {
        console.error("Error:", err.message);
        if (err.status) console.error("Status:", err.status);
    }
};

run();
