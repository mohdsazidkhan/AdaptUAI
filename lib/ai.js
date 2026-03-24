import OpenAI from 'openai';

let client = null;

function getAIClient() {
  if (!client) {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return null;
    }

    client = new OpenAI({
      apiKey: apiKey,
      baseURL: process.env.AI_BASE_URL || 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-OpenRouter-Title': 'AdaptUAI',
      },
    });
  }
  return client;
}

const DEFAULT_MODEL = process.env.AI_MODEL || 'openrouter/free';

function getAvailableModels() {
  const models = [];
  // Check for AI_MODEL1 to AI_MODEL5
  for (let i = 1; i <= 5; i++) {
    const val = process.env[`AI_MODEL${i}`];
    if (val) models.push(val);
  }
  // If no numbered models, use AI_MODEL or default
  if (models.length === 0) {
    models.push(process.env.AI_MODEL || DEFAULT_MODEL);
  }
  return models;
}

/**
 * Generate a non-streaming completion
 */
export async function generateCompletion(systemPrompt, messages, options = {}) {
  const openai = getAIClient();
  if (!openai) {
    return 'AI service is not configured. Please add your OPENROUTER_API_KEY to .env';
  }

  const {
    temperature = parseFloat(process.env.AI_TEMPERATURE) || 0.7,
    maxTokens = parseInt(process.env.AI_MAX_TOKENS) || 1000
  } = options;

  const models = getAvailableModels();
  let lastError = null;

  for (const model of models) {
    try {
      const response = await openai.chat.completions.create({
        model,
        temperature,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
      });
      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error(`AI Failover: Model ${model} failed. Error:`, error.message);
      lastError = error;
      // Continue to next model if it's a rate limit or server error
      if (error.status !== 429 && error.status !== 503 && error.status !== 500) break;
    }
  }

  throw new Error(`AI service error: ${lastError?.message || 'All models failed'}`);
}

/**
 * Generate a streaming completion — returns a ReadableStream
 */
export function generateStreamingCompletion(systemPrompt, messages, options = {}) {
  const openai = getAIClient();
  const encoder = new TextEncoder();

  if (!openai) {
    return new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"AI service is not configured. Please add your OPENROUTER_API_KEY to .env"}}]}\n\n'));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });
  }

  const {
    temperature = parseFloat(process.env.AI_TEMPERATURE) || 0.7,
    maxTokens = parseInt(process.env.AI_MAX_TOKENS) || 1000
  } = options;

  return new ReadableStream({
    async start(controller) {
      const models = getAvailableModels();
      let stream = null;
      let lastError = null;

      for (const model of models) {
        try {
          stream = await openai.chat.completions.create({
            model,
            temperature,
            max_tokens: maxTokens,
            stream: true,
            messages: [
              { role: 'system', content: systemPrompt },
              ...messages,
            ],
          });
          break; // Success!
        } catch (error) {
          console.error(`AI Failover (Streaming): Model ${model} failed. Error:`, error.message);
          lastError = error;
          // Continue to next model if it's a rate limit or server error
          if (error.status !== 429 && error.status !== 503 && error.status !== 500) break;
        }
      }

      if (!stream) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: lastError?.message || 'All models failed' })}\n\n`)
        );
        controller.close();
        return;
      }

      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || '';
          if (text) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        console.error('OpenAI streaming error during read:', error);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`)
        );
        controller.close();
      }
    },
  });
}

/**
 * Check if OpenAI is configured
 */
export function isAIConfigured() {
  return Boolean(process.env.OPENROUTER_API_KEY);
}
