const { buildSystemPrompt } = require('./lib/promptBuilder');
const { generateCompletion } = require('./lib/ai');
const dotenv = require('dotenv');
dotenv.config();

async function testPrompt() {
  console.log('--- Testing System Prompt ---');
  const userProfile = {
    confidence: 0.2, // Low confidence
    learningStyle: 'visual',
    depthPreference: 'surface'
  };
  const context = {
    userName: 'Sazid',
    mode: 'Teaching',
    currentTopic: 'Photosynthesis'
  };
  const prompt = buildSystemPrompt(userProfile, context);
  console.log(prompt);
  console.log('\n--- End of Prompt ---\n');
}

async function testAI() {
  console.log('--- Testing AI Connectivity ---');
  try {
    const response = await generateCompletion('Respond with "Hello, I am AdaptUAI"', [{ role: 'user', content: 'Hi' }]);
    console.log('AI Response:', response);
  } catch (err) {
    console.error('AI Error:', err.message);
  }
}

async function run() {
  await testPrompt();
  // await testAI(); // Commented out to avoid accidental use of user's credits without their presence, but can be run if safe.
}

run();
