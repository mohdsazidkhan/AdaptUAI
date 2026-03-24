import { buildSystemPrompt } from './lib/promptBuilder.js';
import { generateCompletion } from './lib/ai.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function runTests() {
  const testProfiles = [
    { name: 'Low Confidence Child', profile: { confidence: 0.2, patience: 0.8, learningStyle: 'visual', depthPreference: 'surface' } },
    { name: 'High Confidence Expert', profile: { confidence: 0.9, patience: 0.4, learningStyle: 'analytical', depthPreference: 'deep' } },
    { name: 'Fast Practical Learner', profile: { confidence: 0.6, patience: 0.2, learningStyle: 'practical', depthPreference: 'intermediate' } }
  ];

  for (const tp of testProfiles) {
    console.log(`\n--- Testing Persona: ${tp.name} ---`);
    const prompt = buildSystemPrompt(tp.profile, { userName: 'Sazid', currentTopic: 'Quantum Physics' });
    console.log(prompt); 
    console.log('--- End of Persona Test ---\n');
  }
}

async function testAI() {
  console.log('--- Testing OpenRouter Connectivity ---');
  if (!process.env.OPENROUTER_API_KEY) {
    console.error('No OPENROUTER_API_KEY found in .env');
    return;
  }
  try {
    const response = await generateCompletion('Respond with "AdaptUAI is live!"', [{ role: 'user', content: 'Hi' }]);
    console.log('AI Response:', response);
  } catch (err) {
    console.error('AI Error:', err.message);
  }
}

async function main() {
  await runTests();
  await testAI();
}

main();
