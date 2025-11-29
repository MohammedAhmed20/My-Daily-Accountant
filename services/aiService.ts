
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const aiService = {
  scanReceipt: async (base64Image: string): Promise<Partial<Transaction>> => {
    try {
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
      throw error;
    }
  }
};
