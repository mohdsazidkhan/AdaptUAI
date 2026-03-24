'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import MessageBubble from './MessageBubble';
import { TypingIndicator } from './Loader';
import { AUPopup } from './AUBadge';

const DEBOUNCE_MS = 300;

export default function ChatBox({ user, initialSessionId = null }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState(initialSessionId || uuidv4());
  const [showAUPopup, setShowAUPopup] = useState(false);
  const [error, setError] = useState('');
  const [isHistoryLoading, setIsHistoryLoading] = useState(!!initialSessionId);

  // Behavior tracking ref (not state — no re-renders)
  const metricsRef = useRef({
    messageCount: 0,
    totalLength: 0,
    retryCount: 0,
    responseTimes: [],
    lastMessageAt: null,
  });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);
  const debounceRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load history if sessionId exists
  useEffect(() => {
    if (!initialSessionId) {
      setMessages([
        {
          role: 'assistant',
          content: `Hi ${user?.name?.split(' ')[0] || 'there'}! 👋 I'm your AI tutor. What would you like to learn today?\n\nYou can ask me *anything* — from **coding** to **science**, **history** to **math**. Let's explore together! 🚀`,
          timestamp: new Date(),
        },
      ]);
      return;
    }

    async function fetchHistory() {
      setIsHistoryLoading(true);
      try {
        const res = await fetch(`/api/chat?sessionId=${initialSessionId}`);
        const json = await res.json();
        if (json.success && json.chat?.messages) {
          setMessages(json.chat.messages);
          // Update metrics to reflect historical context
          metricsRef.current.messageCount = json.chat.messages.length;
        } else {
          // Fallback if no history found
          setMessages([
            {
              role: 'assistant',
              content: `Session not found or empty. Let's start fresh! 🌟`,
              timestamp: new Date(),
            },
          ]);
        }
      } catch (err) {
        console.error('Failed to fetch chat history:', err);
      } finally {
        setIsHistoryLoading(false);
      }
    }
    fetchHistory();
  }, [initialSessionId, user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      clearTimeout(debounceRef.current);
    };
  }, []);

  const trackMessage = useCallback((messageLength, isRetry = false) => {
    const now = Date.now();
    const metrics = metricsRef.current;
    const responseTimeMs = metrics.lastMessageAt ? now - metrics.lastMessageAt : 5000;

    metricsRef.current = {
      messageCount: metrics.messageCount + 1,
      totalLength: metrics.totalLength + messageLength,
      retryCount: metrics.retryCount + (isRetry ? 1 : 0),
      responseTimes: [...metrics.responseTimes.slice(-19), responseTimeMs],
      lastMessageAt: now,
    };

    return { responseTimeMs, isRetry };
  }, []);

  const sendMessage = useCallback(async (text, isRetry = false) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    setError('');
    setInput('');

    // Track behavior
    const behaviorEvent = trackMessage(trimmed.length, isRetry);

    // Add user message optimistically
    const userMsg = { role: 'user', content: trimmed, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);

    // Build message history for API (exclude welcome msg, last 12)
    const historyForAPI = messages
      .filter((m) => m.role !== 'system')
      .slice(-12)
      .map(({ role, content }) => ({ role, content }));

    // Create placeholder for streaming response
    const streamingId = Date.now();
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: '', timestamp: new Date(), _streamingId: streamingId },
    ]);

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          sessionId,
          messageHistory: historyForAPI,
          behaviorMetrics: {
            responseTimeMs: behaviorEvent.responseTimeMs,
            isRetry: behaviorEvent.isRetry,
            responseTimes: metricsRef.current.responseTimes,
          },
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get response');
      }

      const newSessionId = response.headers.get('X-Session-Id');
      if (newSessionId && newSessionId !== sessionId) {
        setSessionId(newSessionId);
      }

      // Read SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              accumulatedText += parsed.content;
              // Update the placeholder message in real-time
              setMessages((prev) =>
                prev.map((m) =>
                  m._streamingId === streamingId
                    ? { ...m, content: accumulatedText }
                    : m
                )
              );
            }
            if (parsed.error) {
              throw new Error(parsed.error);
            }
          } catch (parseErr) {
            // skip malformed SSE lines
          }
        }
      }

      // Finalize — remove _streamingId marker
      setMessages((prev) =>
        prev.map((m) =>
          m._streamingId === streamingId ? { ...m, _streamingId: undefined } : m
        )
      );

      // Show AU popup with current cost
      const tokenCost = Number(process.env.NEXT_PUBLIC_EACH_CHAT_AU_TOKEN) || 10;
      setShowAUPopup(true);
      setTimeout(() => setShowAUPopup(false), 2500);
    } catch (err) {
      if (err.name === 'AbortError') return; // user cancelled

      const errorMsg = err.message || 'Something went wrong. Please try again.';
      setError(errorMsg);

      // Replace placeholder with error message
      setMessages((prev) =>
        prev.map((m) =>
          m._streamingId === streamingId
            ? {
                ...m,
                content: `⚠️ ${errorMsg}`,
                _streamingId: undefined,
                isError: true,
              }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  }, [isStreaming, messages, sessionId, trackMessage]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => sendMessage(input), DEBOUNCE_MS);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleNewChat = () => {
    abortControllerRef.current?.abort();
    setSessionId(uuidv4());
    setMessages([
      {
        role: 'assistant',
        content: `Starting a fresh session! 🌟 What would you like to explore?`,
        timestamp: new Date(),
      },
    ]);
    setInput('');
    setIsStreaming(false);
    metricsRef.current = { messageCount: 0, totalLength: 0, retryCount: 0, responseTimes: [], lastMessageAt: null };
  };

  const suggestedTopics = [
    '🐍 Explain Python decorators',
    '🧠 How does memory work?',
    '🌍 Tell me about climate change',
    '📐 What is calculus?',
  ];

  const showSuggestions = messages.length <= 1;

  return (
    <div className="flex flex-col h-full relative">
      {/* AU Popup */}
      <AUPopup xp={Number(process.env.NEXT_PUBLIC_EACH_CHAT_AU_TOKEN) || 10} show={showAUPopup} />

      {/* Chat header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-surface-200 bg-surface-50/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center shadow-sm">
            <span className="text-base">🦉</span>
          </div>
          <div>
            <p className="font-bold text-surface-900 text-sm">AdaptUAI Tutor</p>
            <p className={`text-xs font-medium ${isStreaming ? 'text-brand-500 animate-pulse' : 'text-surface-400'}`}>
              {isStreaming ? 'Thinking...' : 'Ready to teach'}
            </p>
          </div>
        </div>
        <button
          onClick={handleNewChat}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-surface-600 hover:text-surface-900 hover:bg-surface-100 rounded-xl transition-all border border-surface-200"
        >
          + New Chat
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-50 custom-scrollbar">
        {isHistoryLoading ? (
          <div className="flex items-center justify-center h-full">
            <TypingIndicator />
          </div>
        ) : (
          messages.map((msg, i) => (
            <MessageBubble key={msg._streamingId || i} message={msg} />
          ))
        )}

        {/* Typing indicator — shows while waiting for first chars */}
        {isStreaming && messages[messages.length - 1]?.content === '' && (
          <div className="flex items-end gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center shadow-sm flex-shrink-0">
              <span className="text-base">🦉</span>
            </div>
            <TypingIndicator />
          </div>
        )}

        {/* Suggested topics */}
        {showSuggestions && (
          <div className="mt-4 animate-slide-up">
            <p className="text-xs font-semibold text-surface-400 mb-2 px-1">Try asking:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {suggestedTopics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => sendMessage(topic)}
                  className="text-left px-4 py-3 bg-surface-100 hover:bg-brand-50 border border-surface-200 hover:border-brand-300 rounded-2xl text-sm font-medium text-surface-700 hover:text-brand-700 transition-all shadow-sm"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex-shrink-0 mx-4 mb-2 px-4 py-3 bg-coral-50 border border-coral-200 rounded-2xl text-sm text-coral-700 font-medium animate-slide-up">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">⚠️</span>
            <span>{error === 'INSUFFICIENT_AU' ? 'Insufficient AU balance' : error}</span>
          </div>
          {error === 'INSUFFICIENT_AU' && (
            <div className="mt-2 flex flex-wrap gap-2">
              <a 
                href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'support@mohdsazidkhan.com'}`}
                className="px-3 py-1.5 bg-surface-50 border border-coral-200 rounded-xl text-[10px] font-black uppercase hover:bg-coral-100 transition-all flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0l-9.75 6.75-9.75-6.75" />
                </svg>
                Email
              </a>
              <a 
                href={`https://wa.me/${(process.env.NEXT_PUBLIC_WHATSAPP_CONTACT || '+917678131912').replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-surface-50 border border-coral-200 rounded-xl text-[10px] font-black uppercase hover:bg-coral-100 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <svg className="w-3.5 h-3.5 fill-[#25D366]" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
              </a>
            </div>
          )}
        </div>
      )}

      {/* Input area */}
      <div className="flex-shrink-0 p-4 border-t border-surface-200 bg-surface-50/90 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything... (Shift+Enter for new line)"
            rows={1}
            disabled={isStreaming}
            className="flex-1 bg-surface-100 border-2 border-surface-200 rounded-2xl px-4 py-3 focus:outline-none focus:border-brand-500 text-surface-900 placeholder:text-surface-400 font-medium transition-all max-h-36 disabled:opacity-60 leading-relaxed"
            style={{ minHeight: '48px' }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 144) + 'px';
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="flex-shrink-0 w-12 h-12 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl flex items-center justify-center shadow-button border-b-4 border-brand-700 active:translate-y-[2px] active:shadow-button-press transition-all"
          >
            {isStreaming ? (
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            )}
          </button>
        </form>
        <p className="text-[10px] text-surface-400 mt-2 text-center">
          Press Enter to send · Shift+Enter for new line · -{process.env.NEXT_PUBLIC_EACH_CHAT_AU_TOKEN || 10} AU Tokens per response
        </p>
      </div>
    </div>
  );
}
