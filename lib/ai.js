import OpenAI from 'openai';

let client = null;

function getOpenAIClient() {
  if (!client) {
    if (!process.env.OPENAI_API_KEY) {
      return null;
    }
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return client;
}

const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

/**
 * Generate a non-streaming completion
 * @param {string} systemPrompt - The system/instruction prompt
 * @param {Array} messages - Array of {role, content} messages
 * @param {object} options - model, temperature overrides
 * @returns {string} The assistant response text
 */
export async function generateCompletion(systemPrompt, messages, options = {}) {
  const openai = getOpenAIClient();
  if (!openai) {
    return 'AI service is not configured. Please add your OPENAI_API_KEY to .env.local';
  }

  const { model = DEFAULT_MODEL, temperature = 0.7, maxTokens = 1500 } = options;

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
  const openai = getOpenAIClient();
  if (!openai) {
    // Return a stream that just sends an error message
    return new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"AI service is not configured. Please add your OPENAI_API_KEY to .env.local"}}]}\n\n'));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });
  }

  const { model = DEFAULT_MODEL, temperature = 0.7, maxTokens = 1500 } = options;

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
  return Boolean(process.env.OPENAI_API_KEY);
}
