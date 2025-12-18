
import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;

export const getGeminiModel = () => {
  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in environment variables.");
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(API_KEY);
  }

  // Use gemini-2.0-flash as it is confirmed available.
  return genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
};
