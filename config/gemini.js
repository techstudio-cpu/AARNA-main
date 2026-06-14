/**
 * Google Gemini AI Configuration
 * Provides a configured GenerativeModel instance for AI-powered features.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('[Gemini] GEMINI_API_KEY not set. AI features will be unavailable.');
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

function getModel(modelName = 'gemini-1.5-flash') {
  if (!genAI) {
    throw new Error('Gemini AI not configured. Set GEMINI_API_KEY environment variable.');
  }
  return genAI.getGenerativeModel({ model: modelName });
}

module.exports = {
  genAI,
  getModel,
  isConfigured: !!GEMINI_API_KEY
};
