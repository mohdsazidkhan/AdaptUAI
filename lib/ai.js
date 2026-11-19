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

// A photo in the messages (OpenAI-style image_url part) tries AI_VISION_MODEL first when set.
function hasImage(messages = []) {
  return messages.some((m) => Array.isArray(m.content) && m.content.some((part) => part?.type === 'image_url'));
}

function getAvailableModels(messages) {
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
  const vision = process.env.AI_VISION_MODEL;
  if (vision && hasImage(messages)) return [vision, ...models.filter((m) => m !== vision)];
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
    temperature = parseFloat(process.env.AI_TEMPERATURE) || 0.35,
    maxTokens = parseInt(process.env.AI_MAX_TOKENS) || 2000
  } = options;

  const models = getAvailableModels(messages);
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
      // Continue to next model if it's a rate limit, server error, or not found error
      const retriable = [400, 404, 408, 429, 500, 502, 503, 504].includes(error.status);
      if (!retriable) break;
    }
  }

  throw new Error(`AI service error: ${lastError?.message || 'All models failed'}`);
}

/**
 * Generate a streaming completion — returns a ReadableStream
 */
export function generateStreamingCompletion(systemPrompt, messages, options = {}) {
  // Aborts the model request when the caller's signal fires (user pressed Stop) or the reader cancels.
  const abort = new AbortController();
  if (options.signal) {
    if (options.signal.aborted) abort.abort();
    else options.signal.addEventListener('abort', () => abort.abort(), { once: true });
  }
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
    temperature = parseFloat(process.env.AI_TEMPERATURE) || 0.35,
    maxTokens = parseInt(process.env.AI_MAX_TOKENS) || 2000
  } = options;

  return new ReadableStream({
    async start(controller) {
      const models = getAvailableModels(messages);
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
          }, { signal: abort.signal });
          break; // Success!
        } catch (error) {
          if (abort.signal.aborted) break; // user stopped: don't try the next model
          console.error(`AI Failover (Streaming): Model ${model} failed. Error:`, error.message);
          lastError = error;
          // Continue to next model if it's a rate limit, server error, or not found error
          const retriable = [400, 404, 408, 429, 500, 502, 503, 504].includes(error.status);
          if (!retriable) break;
        }
      }

      // Enqueue/close can throw once the reader has gone away (Stop pressed); ignore that.
      const send = (payload) => {
        try { controller.enqueue(encoder.encode(`data: ${typeof payload === 'string' ? payload : JSON.stringify(payload)}\n\n`)); } catch { /* closed */ }
      };
      const close = () => { try { controller.close(); } catch { /* closed */ } };

      if (!stream) {
        if (!abort.signal.aborted) {
          console.error('AI streaming: all models failed:', lastError?.message);
          send({ error: 'The AI tutor is busy right now. Please try again in a moment.' });
        }
        close();
        return;
      }

      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || '';
          if (text) send({ content: text });
        }
        send('[DONE]');
        close();
      } catch (error) {
        if (!abort.signal.aborted) {
          console.error('OpenAI streaming error during read:', error);
          send({ error: 'The answer was interrupted. Please try again.' });
        }
        close();
      }
    },
    cancel() {
      abort.abort(); // reader cancelled (user pressed Stop / disconnected): stop the model call too
    },
  });
}

/**
 * Check if OpenAI is configured
 */
export function isAIConfigured() {
  return Boolean(process.env.OPENROUTER_API_KEY);
}
