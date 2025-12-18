
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from backend/.env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY is missing.");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    // There is no direct listModels method on GoogleGenerativeAI client easily accessible in all versions,
    // but let's try a simple generateContent with a known model to see if it's auth issue or model issue.
    // Actually, newer SDKs might not expose listModels directly.
    // Let's try to access the model directly and catch error details.

    console.log("Attempting to access gemini-pro...");
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent("Hello");
    console.log("✅ gemini-pro is working. Response:", (await result.response).text());

  } catch (error: any) {
    console.error("❌ Error accessing gemini-pro:");
    console.error(error);
  }
}

listModels();
