import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Chat from '@/models/Chat';
import { getAuthUser } from '@/lib/auth';
import { generateStreamingCompletion } from '@/lib/ai';
import { buildSystemPrompt, buildTopicDetectionPrompt } from '@/lib/promptBuilder';
import { calculateProfile, summarizeMetrics } from '@/lib/userProfile';
import { generateCompletion } from '@/lib/ai';
import Transaction from '@/models/Transaction';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { message, sessionId, messageHistory = [], behaviorMetrics = null } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    const userId = authUser.userId;

    // ── Load user ────────────────────────────────────────────────────────────
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const tokenCost = Number(process.env.EACH_CHAT_AU_TOKEN) || 10;

    // ── Check AU Balance (Tokens) ──────────────────────────────────────────
    if (user.au < tokenCost) {
      return NextResponse.json({ 
        success: false, 
        error: 'INSUFFICIENT_AU',
        message: `Your AU wallet is empty. To continue, please contact our support via Email (${process.env.CONTACT_EMAIL || 'support@mohdsazidkhan.com'}) or WhatsApp (${process.env.WHATSAPP_CONTACT || '+917678131912'}) to recharge your tokens.` 
      }, { status: 403 });
    }

    // ── Find or create chat session ──────────────────────────────────────────
    const sid = sessionId || uuidv4();
    let chat = await Chat.findOne({ userId, sessionId: sid });
    if (!chat) {
      chat = new Chat({
        userId,
        sessionId: sid,
        title: message.slice(0, 60),
        profileSnapshot: user.mindsetProfile,
      });
    }

    // ── Build personalized system prompt ─────────────────────────────────────
    // Requirement 7: Optional Mode Detection
    let activeMode = 'Teaching';
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('quiz')) {
      activeMode = 'Quiz';
    } else if (lowerMessage.includes('summary')) {
      activeMode = 'Revision';
    }

    const systemPrompt = buildSystemPrompt(user.mindsetProfile, {
      userName: user.name,
      weakAreas: user.weakAreas,
      currentTopic: chat.topic || '',
      mode: activeMode,
    });

    // ── Prepare message history for OpenAI ──────────────────────────────────
    // messageHistory: array of {role, content} from client (last N messages)
    const openAIMessages = [
      ...messageHistory.slice(-12), // last 12 messages for context
      { role: 'user', content: message.trim() },
    ];

    // ── Add user message to chat doc ─────────────────────────────────────────
    chat.addMessage('user', message.trim(), {
      responseTimeMs: behaviorMetrics?.responseTimeMs,
      isRetry: behaviorMetrics?.isRetry || false,
    });

    // ── Stream AI response ───────────────────────────────────────────────────
    const stream = generateStreamingCompletion(systemPrompt, openAIMessages);

    // ── Collect the full response to save ────────────────────────────────────
    // We collect via a TransformStream so we can save after streaming completes
    let fullResponse = '';
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = decoder.decode(chunk, { stream: true });
        // Parse SSE lines to extract content
        const lines = text.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) fullResponse += parsed.content;
            } catch {}
          }
        }
        controller.enqueue(chunk);
      },
      async flush() {
        // Save the complete response to DB
        try {
          chat.addMessage('assistant', fullResponse || '(no response)');

          // Deduct AU (Consumption Mode)
          const tokenCost = Number(process.env.EACH_CHAT_AU_TOKEN) || 10;
          await user.spendAU(tokenCost);

          // Record Transaction History
          await Transaction.create({
            userId: user._id,
            type: 'SPEND',
            amount: tokenCost,
            description: `Chat interaction: ${chat.title.slice(0, 40)}${chat.title.length > 40 ? '...' : ''}`
          });

          // Track in chat session (tokens spent)
          chat.auEarned = (chat.auEarned || 0) + tokenCost;
          await chat.save();

          // Update mindset profile if behavioral metrics provided
          if (behaviorMetrics) {
            const sessionMetrics = summarizeMetrics({
              messageCount: chat.sessionMetrics.messageCount,
              totalLength: chat.sessionMetrics.totalLength || 0,
              retryCount: chat.sessionMetrics.retryCount,
              responseTimes: behaviorMetrics.responseTimes || [],
            });
            user.mindsetProfile = calculateProfile(user.mindsetProfile, sessionMetrics);
          }

          await user.save();

          // ── Advanced Mindset Analysis (Topic & Weak Area Detection) ──────────
          if (fullResponse) {
            // Topic detection (if not already set)
            if (!chat.topic) {
              generateCompletion(buildTopicDetectionPrompt(), [
                { role: 'user', content: `User: "${message}"\nAI: "${fullResponse.slice(0, 300)}"` },
              ])
                .then(async (topic) => {
                  if (topic && topic.length < 60) {
                    await Chat.findOneAndUpdate({ userId, sessionId: sid }, { topic, title: topic });
                    await User.findByIdAndUpdate(userId, { $addToSet: { topicsExplored: topic } });
                  }
                })
                .catch(() => {});
            }

            // Weak area detection (Every few messages or based on heuristics)
            // For "World-Class" feel, we check periodically
            if (chat.messages.length % 3 === 0) {
              generateCompletion(buildWeakAreaPrompt(), [
                { role: 'user', content: `Analyze this interaction for learning gaps:\nUser: "${message}"\nAI: "${fullResponse.slice(0, 400)}"` },
              ])
                .then(async (result) => {
                  try {
                    const parsed = JSON.parse(result);
                    if (parsed.weakArea && parsed.confidence > 0.6) {
                      await User.findByIdAndUpdate(userId, { $addToSet: { weakAreas: parsed.weakArea } });
                    }
                  } catch (e) {}
                })
                .catch(() => {});
            }
          }
        } catch (saveErr) {
          console.error('[Chat route] Error saving chat:', saveErr);
        }
      },
    });

    const responseStream = stream.pipeThrough(transformStream);

    return new Response(responseStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Session-Id': sid,
      },
    });
  } catch (error) {
    console.error('[POST /api/chat] Error:', error);
    return NextResponse.json({ error: 'Internal server error. Please try again.' }, { status: 500 });
  }
}

/**
 * GET /api/chat?sessionId=...  — Get chat history for a session
 * GET /api/chat                — Get recent sessions list
 */
export async function GET(request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const userId = authUser.userId;

    if (sessionId) {
      const chat = await Chat.findOne({ userId, sessionId });
      if (!chat) {
        return NextResponse.json({ error: 'Chat session not found.' }, { status: 404 });
      }
      return NextResponse.json({ success: true, chat });
    }

    // Return recent sessions list
    const chats = await Chat.getRecentByUser(userId, 20);
    return NextResponse.json({ success: true, chats });
  } catch (error) {
    console.error('[GET /api/chat] Error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
