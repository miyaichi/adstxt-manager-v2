import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;

export const getGeminiModel = () => {
  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in environment variables.');
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(API_KEY);
  }

  // TODO: Update the model used to match the Gemini model update.
  //
  // Situation in Dec 2025:
  // - gemini-2.0-flash is stable.
  // - gemini-3-flash-preview is a preview release. The stable version may be released in Q1 2026.
  return genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
};
