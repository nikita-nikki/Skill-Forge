import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyCGMcSnkoJxAg-KTGV4smsA9s9jFmwhOXU");

async function test() {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
  });

  const result = await model.generateContent("Say hello");
  console.log(result.response.text());
}

test();