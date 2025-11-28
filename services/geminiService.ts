import { GoogleGenAI, Type } from "@google/genai";
import { Priority } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeConstructionImage = async (base64Image: string) => {
  try {
    // Strip the data:image/jpeg;base64, prefix if present
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64
            }
          },
          {
            text: "Analyze this image from a construction site. Identify the potential defect or task. Provide a short title, a detailed description of the issue, and suggest a priority level."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "A short, concise title for the issue (max 50 chars)" },
            description: { type: Type.STRING, description: "A detailed technical description of the problem observed." },
            priority: { type: Type.STRING, enum: [Priority.LOW, Priority.MEDIUM, Priority.HIGH] }
          },
          required: ["title", "description", "priority"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;
  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    throw error;
  }
};
