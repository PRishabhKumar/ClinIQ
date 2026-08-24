import { GoogleGenAI } from '@google/genai';

class LLMService {
  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  _extractJson(text) {
    // Strip markdown code blocks if present
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const cleaned = match ? match[1].trim() : text.trim();
    return JSON.parse(cleaned);
  }

  async generatePreVisitSummary(symptoms) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const prompt = `You are a medical AI assistant. Analyze the patient's symptoms and respond ONLY with a valid JSON object. Do NOT include any explanation, markdown, or code blocks.

Symptoms: ${symptoms}

Respond with exactly this JSON structure:
{
  "urgency": "LOW" | "MEDIUM" | "HIGH",
  "chiefComplaint": "short clinical summary",
  "suggestedQuestions": ["question 1", "question 2", "question 3"]
}`;

    const tryModel = async (modelName) => {
      const response = await this.ai.models.generateContent({
        model: modelName,
        contents: prompt,
      });
      const text = response.text;
      console.log(`[LLM Service] Raw response from ${modelName}:`, text?.slice(0, 200));
      return this._extractJson(text);
    };

    try {
      console.log('[LLM Service] Calling gemma-4-31b-it...');
      const data = await tryModel('gemma-4-31b-it');
      return { success: true, data, rawLlmResponse: JSON.stringify(data) };
    } catch (primaryError) {
      console.warn('[LLM Service] Primary model failed:', primaryError.message, '— trying fallback...');
      try {
        const data = await tryModel('gemma-4-26b-a4b-it');
        return { success: true, data, rawLlmResponse: JSON.stringify(data) };
      } catch (fallbackError) {
        console.error('[LLM Service] Fallback also failed:', fallbackError.message);
        return { success: false, error: fallbackError.message };
      }
    }
  }

  async generatePostVisitSummary(clinicalNotes) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const prompt = `You are a medical AI assistant. Convert the following clinical notes into a structured patient summary. Respond ONLY with a valid JSON object. Do NOT include any explanation, markdown, or code blocks.

Clinical Notes: ${clinicalNotes}

Respond with exactly this JSON structure:
{
  "patientSummary": "patient-friendly summary of the visit",
  "medicationSchedule": "clear medication instructions",
  "followUpSteps": "next steps for the patient"
}`;

    const tryModel = async (modelName) => {
      const response = await this.ai.models.generateContent({
        model: modelName,
        contents: prompt,
      });
      const text = response.text;
      console.log(`[LLM Service] Raw response from ${modelName}:`, text?.slice(0, 200));
      return this._extractJson(text);
    };

    try {
      console.log('[LLM Service] Calling gemma-4-31b-it...');
      const data = await tryModel('gemma-4-31b-it');
      return { success: true, data, rawLlmResponse: JSON.stringify(data) };
    } catch (primaryError) {
      console.warn('[LLM Service] Primary model failed:', primaryError.message, '— trying fallback...');
      try {
        const data = await tryModel('gemma-4-26b-a4b-it');
        return { success: true, data, rawLlmResponse: JSON.stringify(data) };
      } catch (fallbackError) {
        console.error('[LLM Service] Fallback also failed:', fallbackError.message);
        return { success: false, error: fallbackError.message };
      }
    }
  }
}

export default new LLMService();
