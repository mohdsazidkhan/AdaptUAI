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

/**
 * Generate a non-streaming completion
 * @param {string} systemPrompt - The system/instruction prompt
 * @param {Array} messages - Array of {role, content} messages
 * @param {object} options - model, temperature overrides
 * @returns {string} The assistant response text
 */
export async function generateCompletion(systemPrompt, messages, options = {}) {
  const openai = getAIClient();
  if (!openai) {
    return 'AI service is not configured. Please add your OPENROUTER_API_KEY to .env';
  }

  const model = options.model || process.env.AI_MODEL || DEFAULT_MODEL;
  const {
    temperature = parseFloat(process.env.AI_TEMPERATURE) || 0.7,
    maxTokens = parseInt(process.env.AI_MAX_TOKENS) || 1000
  } = options;


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
    console.error('OpenAI error:', error);
    throw new Error(`AI service error: ${error.message}`);
  }
}

/**
 * Generate a streaming completion — returns a ReadableStream
 * @param {string} systemPrompt - The system/instruction prompt
 * @param {Array} messages - Array of {role, content} messages
 * @param {object} options - model, temperature overrides
 * @returns {ReadableStream}
 */
export function generateStreamingCompletion(systemPrompt, messages, options = {}) {
  const openai = getAIClient();
  if (!openai) {
    // Return a stream that just sends an error message
    return new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"AI service is not configured. Please add your OPENROUTER_API_KEY to .env"}}]}\n\n'));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });
  }

  const model = options.model || process.env.AI_MODEL || DEFAULT_MODEL;
  const { temperature = 0.7, maxTokens = 2000 } = options;

  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        const stream = await openai.chat.completions.create({
          model,
          temperature,
          max_tokens: maxTokens,
          stream: true,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
          ],
        });

        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || '';
          if (text) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        console.error('OpenAI streaming error:', error);
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
