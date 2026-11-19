'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import MessageBubble from './MessageBubble';
import { TypingIndicator } from './Loader';
import { AUPopup } from './AUBadge';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import { ImagePlus, Mic, X, Send, SquarePen, Square } from 'lucide-react';

const DEBOUNCE_MS = 300;
const MAX_IMAGE_SIDE = 1280;
const MIC_BLOCKED = 'Microphone is blocked. Click the lock icon in the address bar, allow the microphone, then try again.';

// Photos are shrunk in the browser (max 1280px, JPEG) so uploads stay small and cheap for the AI.
function shrinkImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff'; // transparent PNG areas become white, not black
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('unreadable image')); };
    img.src = url;
  });
}

export default function ChatBox({ user, initialSessionId = null, onSuccess }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState(initialSessionId || uuidv4());
  const [showAUPopup, setShowAUPopup] = useState(false);
  const [error, setError] = useState('');
  const [isHistoryLoading, setIsHistoryLoading] = useState(!!initialSessionId);
  const [image, setImage] = useState(null); // shrunk JPEG data URL waiting to be sent
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const fileRef = useRef(null);
  const recognitionRef = useRef(null);

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
      // Only set welcome message if messages are empty
      setMessages((prev) => {
        if (prev.length > 0) return prev;
        return [
          {
            role: 'assistant',
            content: `Hi ${user?.name?.split(' ')[0] || 'there'}! 👋 I'm your AI tutor. What would you like to learn today?\n\nYou can ask me *anything* — from **coding** to **science**, **history** to **math**. Let's explore together! 🚀`,
            timestamp: new Date(),
          },
        ];
      });
      return;
    }

    async function fetchHistory() {
      setIsHistoryLoading(true);
      try {
        const data = await api.get(`/chat?sessionId=${initialSessionId}`);
        if (data.chat?.messages) {
          setMessages(data.chat.messages);
          // Update metrics to reflect historical context
          metricsRef.current.messageCount = data.chat.messages.length;
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
    setVoiceSupported(typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition));
    return () => {
      abortControllerRef.current?.abort();
      clearTimeout(debounceRef.current);
      recognitionRef.current?.abort();
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

  // opts.base: the message list to continue from (a retry drops the old question + answer first).
  // opts.regenerate: the old answer was saved on the server, so the server replaces it.
  const sendMessage = useCallback(async (text, isRetry = false, photo = null, opts = {}) => {
    const trimmed = text.trim() || (photo ? 'Explain this image and solve the question in it.' : '');
    if (!trimmed || isStreaming) return;

    recognitionRef.current?.abort();
    setError('');
    setInput('');
    setImage(null);

    // Track behavior
    const behaviorEvent = trackMessage(trimmed.length, isRetry);

    // Add user message optimistically
    const userMsg = { role: 'user', content: trimmed, timestamp: new Date(), ...(photo ? { image: photo } : {}) };
    setMessages((prev) => [...(opts.base || prev), userMsg]);
    setIsStreaming(true);

    // Create placeholder for streaming response
    const streamingId = Date.now();
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: '', timestamp: new Date(), _streamingId: streamingId },
    ]);

    const retryInfo = { text: trimmed, photo };
    let accumulatedText = '';
    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          ...(photo ? { image: photo } : {}),
          ...(opts.regenerate ? { regenerate: true } : {}),
          sessionId, // the server reads this chat's history from the database
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
        const err = new Error(errorData.error || 'Failed to get response');
        err.apiMessage = errorData.message;
        throw err;
      }

      const newSessionId = response.headers.get('X-Session-Id');
      if (newSessionId && newSessionId !== sessionId) {
        setSessionId(newSessionId);
      }

      // Read SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let streamError = '';

      while (true) {
        const { done, value } = await reader.read();

        if (value) {
          buffer += decoder.decode(value, { stream: !done });
        }

        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the incomplete line in the buffer

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;

          const data = trimmedLine.slice(6).trim();
          if (data === '[DONE]') continue;

          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch (parseErr) {
            console.error('SSE Parse Error:', parseErr, 'Line:', line);
            continue;
          }
          if (parsed.content) {
            accumulatedText += parsed.content;
            setMessages((prev) =>
              prev.map((m) =>
                m._streamingId === streamingId
                  ? { ...m, content: accumulatedText }
                  : m
              )
            );
          }
          // The server reports model failures inside the stream; remember it and stop reading.
          if (parsed.error) streamError = parsed.error;
        }

        if (done) {
          // Final check for anything remaining in buffer
          if (buffer.trim()) {
            const trimmedLine = buffer.trim();
            if (trimmedLine.startsWith('data: ')) {
              const data = trimmedLine.slice(6).trim();
              if (data !== '[DONE]') {
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    accumulatedText += parsed.content;
                    setMessages((prev) =>
                      prev.map((m) =>
                        m._streamingId === streamingId
                          ? { ...m, content: accumulatedText }
                          : m
                      )
                    );
                  }
                } catch (e) { }
              }
            }
          }
          break;
        }
        if (streamError) break;
      }

      if (streamError) throw new Error(streamError);
      if (!accumulatedText.trim()) throw new Error('No answer came back. Please try again.');

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

      // Refresh user data (if callback provided)
      if (onSuccess) onSuccess();
    } catch (err) {
      // Stopped by the user: keep whatever text already arrived, mark it, and offer Retry.
      // Nothing is saved or charged on the server for a stopped answer.
      if (err.name === 'AbortError') {
        setMessages((prev) =>
          prev.map((m) =>
            m._streamingId === streamingId
              ? { ...m, content: accumulatedText, _streamingId: undefined, cancelled: true, retry: retryInfo }
              : m
          )
        );
        return;
      }

      const errorMsg = err.message || 'Something went wrong. Please try again.';
      const outOfAU = errorMsg === 'INSUFFICIENT_AU';
      if (outOfAU) setError(errorMsg);

      if (outOfAU) {
        const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'support@mohdsazidkhan.com';
        const phone = process.env.NEXT_PUBLIC_WHATSAPP_CONTACT || '+917678131912';
        const waLink = `https://wa.me/${phone.replace(/[^0-9]/g, '')}`;

        toast.error(
          <div className="flex flex-col gap-2">
            <p className="font-bold">Your AdaptUAI AU wallet is empty! 🕳️</p>
            <p className="text-xs leading-relaxed opacity-90 font-medium">
              To continue, please contact our support to recharge your tokens.
            </p>
            <div className="flex gap-2 mt-1">
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <span>📧</span> Email
              </a>
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <span>💬</span> WhatsApp
              </a>
            </div>
          </div>,
          {
            position:"top-center",
            autoClose: 12000,
            hideProgressBar: false,
            closeOnClick: false,
            pauseOnHover: true,
            draggable: true,
          }
        );
      }

      // Replace placeholder with error message
      setMessages((prev) =>
        prev.map((m) =>
          m._streamingId === streamingId
            ? {
              ...m,
              content: outOfAU ? '⚠️ Your AU balance is too low for this answer. Recharge to continue.' : `⚠️ ${errorMsg}`,
              _streamingId: undefined,
              isError: true,
              // Retrying cannot help while the wallet is empty.
              retry: outOfAU ? null : retryInfo,
            }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  }, [isStreaming, messages, sessionId, trackMessage]);

  // Stop the answer that is streaming right now.
  const stopStreaming = () => abortControllerRef.current?.abort();

  // Retry the assistant message at `index`: drop it and its question, then ask again.
  // A failed/stopped answer was never saved; a finished one is replaced on the server (regenerate).
  const retryAt = (index) => {
    if (isStreaming) return;
    const answer = messages[index];
    const question = messages[index - 1];
    if (!answer || question?.role !== 'user') return;
    const text = answer.retry?.text ?? question.content;
    const photo = answer.retry ? answer.retry.photo : question.image || null;
    const regenerate = !answer.isError && !answer.cancelled;
    sendMessage(text, true, photo, { base: messages.slice(0, index - 1), regenerate });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => sendMessage(input, false, image), DEBOUNCE_MS);
  };

  const pickImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      toast.error('Only JPG or PNG images are allowed.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error('This image is too large. Please choose one under 15 MB.');
      return;
    }
    try {
      setImage(await shrinkImage(file));
      inputRef.current?.focus();
    } catch {
      toast.error('Could not read this image.');
    }
  };

  // ---- Voice: the browser's own speech-to-text (Chrome, Edge, Safari, Android). Free and instant;
  // the spoken words fill the box while talking; the user checks them and presses Send.
  const stopVoice = () => recognitionRef.current?.stop();
  const startVoice = async () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition || isStreaming || listening) return;
    // Ask for the microphone first (the browser shows its Allow / Block prompt); the test stream is closed straight away.
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch (err) {
        if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') toast.error(MIC_BLOCKED, { autoClose: 6000 });
        else toast.error('No microphone found on this device.');
        return;
      }
    }
    const recognition = new Recognition();
    // Hindi browsers get hi-IN; everyone else Indian English (also handles Hinglish reasonably).
    recognition.lang = (navigator.language || '').toLowerCase().startsWith('hi') ? 'hi-IN' : 'en-IN';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    const before = input.trim();
    let spoken = '';
    let failed = false;
    recognition.onresult = (event) => {
      spoken = Array.from(event.results).map((r) => r[0]?.transcript || '').join(' ').replace(/\s+/g, ' ').trim();
      setInput(before ? `${before} ${spoken}` : spoken);
    };
    recognition.onerror = (event) => {
      failed = true;
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') toast.error(MIC_BLOCKED, { autoClose: 6000 });
      else if (event.error !== 'aborted') toast.error("Didn't catch that. Please try again.");
    };
    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
      // Nothing is sent here: the words stay in the box so the user can check or fix them, then press Send.
      if (!failed && !spoken) toast.error("Didn't catch that. Please try again.");
      else if (spoken) setTimeout(() => {
        const el = inputRef.current;
        if (!el) return;
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 144)}px`;
      }, 0);
    };
    recognitionRef.current = recognition;
    setListening(true);
    try { recognition.start(); } catch { setListening(false); recognitionRef.current = null; }
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
    setImage(null);
    recognitionRef.current?.abort();
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
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 sm:px-4 border-b border-surface-200 bg-surface-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-brand-500 rounded-full flex items-center justify-center">
            <span className="text-lg">🦉</span>
          </div>
          <div>
            <p className="font-semibold text-surface-900 text-[15px]">AdaptUAI Tutor</p>
            <p className={`text-xs font-medium ${isStreaming ? 'text-brand-500 animate-pulse' : 'text-surface-400'}`}>
              {isStreaming ? 'Thinking...' : 'Ready to teach'}
            </p>
          </div>
        </div>
        <button
          onClick={handleNewChat}
          className="flex h-9 items-center gap-1.5 rounded-full bg-surface-100 px-3 text-sm font-semibold text-surface-900 transition-colors hover:bg-surface-200"
        >
          <SquarePen className="h-4 w-4" /> New chat
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-surface-50 custom-scrollbar">
        {isHistoryLoading ? (
          <div className="flex items-center justify-center h-full">
            <TypingIndicator />
          </div>
        ) : (
          messages.map((msg, i) => {
            // Retry on a failed/stopped answer, and Regenerate on the latest finished one.
            const canRetry =
              !isStreaming && i > 0 && msg.role === 'assistant' && !msg._streamingId &&
              messages[i - 1]?.role === 'user' && msg.retry !== null &&
              (msg.isError || msg.cancelled || i === messages.length - 1);
            return (
              <MessageBubble
                key={msg._streamingId || i}
                message={msg}
                onRetry={canRetry ? () => retryAt(i) : undefined}
                onStop={msg._streamingId ? stopStreaming : undefined}
              />
            );
          })
        )}


        {/* Suggested topics */}
        {showSuggestions && (
          <div className="mt-4 animate-slide-up">
            <p className="text-sm font-semibold text-surface-500 mb-2 px-1">Try asking</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {suggestedTopics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => sendMessage(topic)}
                  className="text-left px-3 py-2.5 bg-surface-100 hover:bg-surface-200 rounded-lg text-sm font-medium text-surface-900 transition-colors"
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
        <div className="flex-shrink-0 mx-3 mb-2 px-3 py-2.5 bg-coral-50 rounded-lg text-sm text-coral-600 font-medium animate-slide-up">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">⚠️</span>
            <span>{error === 'INSUFFICIENT_AU' ? 'Insufficient AU balance' : error}</span>
          </div>
          {error === 'INSUFFICIENT_AU' && (
            <div className="mt-2 flex flex-wrap gap-2">
              <a
                href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'support@mohdsazidkhan.com'}`}
                className="px-3 h-8 bg-surface-50 rounded-full text-xs font-semibold text-surface-900 hover:bg-surface-100 transition-colors flex items-center gap-1.5"
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
                className="px-3 h-8 bg-surface-50 rounded-full text-xs font-semibold text-surface-900 hover:bg-surface-100 transition-colors flex items-center gap-1.5"
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
      <div className="flex-shrink-0 p-2.5 sm:p-3 pb-[max(0.625rem,env(safe-area-inset-bottom))] border-t border-surface-200 bg-surface-50">
        {image && (
          <div className="mb-2 flex items-center gap-2">
            <span className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="Attached image" className="h-14 w-14 rounded-lg border border-surface-200 object-cover" />
              <button
                type="button"
                onClick={() => setImage(null)}
                aria-label="Remove image"
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-surface-50 text-surface-900 shadow ring-1 ring-surface-200"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
            <span className="text-xs text-surface-400">Ask about this image or just press send.</span>
          </div>
        )}
        {/* One row: photo, auto-growing text box, mic, send - all 36px and bottom-aligned (same as AajExam AI) */}
        <form onSubmit={handleSubmit} className="flex items-end gap-1 rounded-2xl border border-surface-200 bg-surface-100 p-1.5 transition-colors focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/15">
          <input ref={fileRef} type="file" accept="image/jpeg,image/png" onChange={pickImage} className="hidden" />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={isStreaming}
            aria-label="Attach JPG or PNG image"
            title="Attach JPG or PNG image"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-surface-500 transition-colors hover:bg-surface-50 hover:text-brand-500 disabled:opacity-40"
          >
            <ImagePlus className="h-[18px] w-[18px]" />
          </button>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={listening ? 'Listening… speak now' : 'Ask anything…'}
            rows={1}
            disabled={isStreaming}
            className="block min-w-0 flex-1 resize-none self-end border-0 bg-transparent px-1.5 py-2 text-sm leading-5 text-surface-900 outline-none placeholder:text-surface-400 disabled:opacity-60"
            style={{ height: 36 }}
            onInput={(e) => {
              e.target.style.height = '36px';
              e.target.style.height = Math.min(e.target.scrollHeight, 144) + 'px';
            }}
          />
          {voiceSupported && (
            <button
              type="button"
              onClick={listening ? stopVoice : startVoice}
              disabled={isStreaming}
              aria-pressed={listening}
              aria-label={listening ? 'Stop listening' : 'Ask by voice'}
              title={listening ? 'Stop listening' : 'Ask by voice'}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-40 ${listening ? 'animate-pulse bg-coral-500 text-white' : 'text-surface-500 hover:bg-surface-50 hover:text-brand-500'}`}
            >
              <Mic className="h-[18px] w-[18px]" />
            </button>
          )}
          {isStreaming ? (
            // While answering, the send button becomes Stop.
            <button
              type="button"
              onClick={stopStreaming}
              aria-label="Stop answer"
              title="Stop answer"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white transition hover:brightness-110"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim() && !image}
              aria-label="Send"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white transition hover:brightness-110 disabled:opacity-40"
            >
              <Send className="h-4 w-4 -translate-x-px translate-y-px" />
            </button>
          )}
        </form>
        <p className="mt-1.5 text-center text-xs text-surface-400">
          Enter to send · Shift+Enter for a new line · {process.env.NEXT_PUBLIC_EACH_CHAT_AU_TOKEN || 10} AU per answer · AI can make mistakes
        </p>
      </div>
    </div>
  );
}
