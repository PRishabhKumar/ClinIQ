import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function testModel(modelName) {
  console.log(`\n🧪 Testing model: ${modelName}`);
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: 'Say "Hello from ClinIQ!" in one sentence.',
    });
    const text = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log(`✅ SUCCESS: ${text}`);
    return true;
  } catch (err) {
    console.error(`❌ FAILED: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('=== ClinIQ LLM Test ===');
  console.log(`API Key: ${process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.slice(0, 8) + '...' : 'NOT SET'}`);

  await testModel('gemma-4-31b-it');
  await testModel('gemma-4-26b-a4b-it');

  console.log('\n=== Done ===');
}

main();
