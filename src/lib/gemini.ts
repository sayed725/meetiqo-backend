import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from './logger';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  logger.warn('GEMINI_API_KEY not set. AI features will not work.');
}

const genAI = new GoogleGenerativeAI(apiKey || '');

export const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
  },
});

export async function callGemini(prompt: string): Promise<string> {
  try {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (err) {
    logger.error({ err }, 'Gemini API error');
    throw new Error('AI service error');
  }
}
