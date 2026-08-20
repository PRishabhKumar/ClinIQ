import { GoogleGenAI, Type } from '@google/genai';

class LLMService {
  constructor() {
    // If the key is not present, we will gracefully fallback later in the flow
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  async generatePreVisitSummary(symptoms) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    try {
      const prompt = `Analyse these symptoms and return: urgency level (Low / Medium / High), chief complaint, and three suggested questions for the doctor. Symptoms: ${symptoms}`;

      // Enforce JSON schema to guarantee structured output
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              urgency: {
                type: Type.STRING,
                description: "The urgency level: LOW, MEDIUM, or HIGH"
              },
              chiefComplaint: {
                type: Type.STRING,
                description: "A short clinical summary of the chief complaint"
              },
              suggestedQuestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING
                },
                description: "Three suggested questions for the doctor to ask the patient"
              }
            },
            required: ["urgency", "chiefComplaint", "suggestedQuestions"]
          }
        }
      });

      return {
        success: true,
        data: JSON.parse(response.text),
        rawLlmResponse: response.text
      };
    } catch (error) {
      console.error("[LLM Service] Failed to generate summary:", error);
      return { success: false, error: error.message };
    }
  }
}

export default new LLMService();
