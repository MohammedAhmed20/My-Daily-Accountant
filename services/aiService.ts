
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction } from '../types';

// Initialize AI client only if API key is available
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
let ai: any = null;

if (apiKey && apiKey !== 'PLACEHOLDER_API_KEY') {
  ai = new GoogleGenAI({ apiKey });
}

export const aiService = {
  scanReceipt: async (base64Image: string): Promise<Partial<Transaction>> => {
    try {
      if (!ai) {
        const errorMsg = "Gemini API Key not configured. Please add GEMINI_API_KEY to .env.local file.";
        console.warn(errorMsg);
        return {
          amount: 0,
          description: "Gemini API not available",
          category: "Other"
        };
      }

      // Remove data URL prefix if present
      const base64Data = base64Image.split(',')[1] || base64Image;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg', // Assuming jpeg/png, API is flexible
                data: base64Data
              }
            },
            {
              text: `Analyze this receipt image. Extract the total amount, the date (YYYY-MM-DD format), the merchant name as description, and suggest a category (e.g. Food, Transport, Shopping). Return JSON.`
            }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              amount: { type: Type.NUMBER },
              date: { type: Type.STRING },
              description: { type: Type.STRING },
              category: { type: Type.STRING }
            },
            required: ["amount", "description"]
          }
        }
      });

      if (response.text) {
        return JSON.parse(response.text);
      }
      return {};
    } catch (error) {
      console.error("AI Scan Error:", error);
      // Return fallback data instead of throwing
      return {
        amount: 0,
        description: "Error processing receipt",
        category: "Other"
      };
    }
  }
};
