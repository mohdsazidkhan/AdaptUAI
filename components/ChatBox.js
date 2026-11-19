'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import MessageBubble from './MessageBubble';
import { TypingIndicator } from './Loader';
import { AUPopup } from './AUBadge';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import { ImagePlus, Mic, X, Send, SquarePen, Square, MoreVertical, Share2, Copy, Download, FileText, ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { canSpeak, speak, stopSpeaking } from '@/lib/speech';
import Link from 'next/link';

const DEBOUNCE_MS = 300;

// Answer style chips above the input. "Auto" lets the server guess from the message.
// ids must match MODES in lib/promptBuilder.js (each has its own instructions there).
const MODE_CHIPS = [
  { id: 'auto', label: 'Auto', hint: 'Picks the best style from your question' },
  { id: 'Teaching', label: 'Teach', hint: 'Step-by-step explanation with a practice question' },
  { id: 'Simple', label: 'Simple', hint: 'Explain in very easy words, like to a child', placeholder: 'What should I explain simply?' },
  { id: 'Hint', label: 'Hint', hint: 'Guides you with hints, without giving the answer away', placeholder: 'Paste a question you want to solve yourself…' },
  { id: 'Solve', label: 'Solve', hint: 'Full worked solution, step by step', placeholder: 'Type or attach the question to solve…' },
  { id: 'Doubt Solving', label: 'Doubt', hint: 'Clears exactly what confuses you', placeholder: 'What part is confusing you?' },
  { id: 'Quiz', label: 'Quiz', hint: '3-5 MCQs to test yourself', placeholder: 'Quiz me on which topic?' },
  { id: 'Practice', label: 'Practice', hint: 'Practice problems with answers at the end', placeholder: 'Practice problems on which topic?' },
  { id: 'Flashcards', label: 'Flashcards', hint: 'Quick question-answer cards to revise', placeholder: 'Flashcards for which topic?' },
  { id: 'Revision', label: 'Revise', hint: 'Short revision sheet of the key points', placeholder: 'Which topic to revise?' },
  { id: 'Memory Tricks', label: 'Memory tricks', hint: 'Mnemonics and tricks to remember', placeholder: 'What do you need to remember?' },
  { id: 'Exam Prep', label: 'Exam prep', hint: 'Likely exam questions and how to score', placeholder: 'Which topic or exam?' },
  { id: 'Compare', label: 'Compare', hint: 'Difference table between two things', placeholder: 'e.g. Mitosis vs meiosis' },
  { id: 'Study Plan', label: 'Study plan', hint: 'A day-by-day plan for your goal', placeholder: 'Your goal, exam date and daily study time…' },
  { id: 'Check Answer', label: 'Check answer', hint: 'Marks your answer and shows mistakes', placeholder: 'Paste the question and your answer…' },
];
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
  const [mode, setMode] = useState('auto');

  // Remember the chosen answer style on this device.
  useEffect(() => {
    try {
      const saved = localStorage.getItem('adaptuai-mode');
      if (saved && MODE_CHIPS.some((m) => m.id === saved)) setMode(saved);
    } catch { /* storage unavailable */ }
  }, []);
  // Read every answer aloud (saved on this device). Questions asked by voice are always answered aloud.
  const [readAloud, setReadAloud] = useState(false);
  const [speechOk, setSpeechOk] = useState(false);
  const readAloudRef = useRef(false);
  const voiceUsedRef = useRef(false);
  useEffect(() => {
    setSpeechOk(canSpeak());
    try {
      const on = localStorage.getItem('adaptuai-read-aloud') === '1';
      setReadAloud(on);
      readAloudRef.current = on;
    } catch { /* storage unavailable */ }
  }, []);
  const toggleReadAloud = () => {
    const on = !readAloud;
    setReadAloud(on);
    readAloudRef.current = on;
    if (!on) stopSpeaking();
    try { localStorage.setItem('adaptuai-read-aloud', on ? '1' : '0'); } catch { /* storage unavailable */ }
    toast.info(on ? 'Answers will be read aloud' : 'Read aloud is off', { autoClose: 1500 });
  };

  const chooseMode = (id) => {
    setMode(id);
    try { localStorage.setItem('adaptuai-mode', id); } catch { /* storage unavailable */ }
  };
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
            welcome: true,
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
              welcome: true,
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
      stopSpeaking();
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
    stopSpeaking();
    const viaVoice = voiceUsedRef.current;
    voiceUsedRef.current = false;
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
    const answerAt = new Date(); // also the answer's read-aloud id (see MessageBubble)
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', content: '', timestamp: answerAt, _streamingId: streamingId },
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
          ...(Number.isInteger(opts.keepMessages) ? { keepMessages: opts.keepMessages } : {}),
          ...(mode !== 'auto' ? { mode } : {}),
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

      // Read the answer aloud when the learner asked by voice or turned Read aloud on.
      if (viaVoice || readAloudRef.current) speak(answerAt.getTime(), accumulatedText);

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
  }, [isStreaming, messages, sessionId, trackMessage, mode]);

  // Stop the answer that is streaming right now.
  const stopStreaming = () => abortControllerRef.current?.abort();

  // Retry the assistant message at `index`: drop it and its question, then ask again.
  // A failed/stopped answer was never saved; a finished one is replaced on the server (regenerate).
  // How many messages the server has saved before `index`: every finished answer was saved
  // together with its question (failed, stopped and welcome messages never are).
  const savedCountBefore = (index) =>
    2 * messages.slice(0, index).filter((m) => m.role === 'assistant' && !m.welcome && !m.isError && !m.cancelled && m.content?.trim()).length;

  // Edit a sent question: drop it and everything after it, then ask the new wording.
  const editAt = (index, newText) => {
    const original = messages[index];
    const text = newText.trim();
    if (isStreaming || !original || original.role !== 'user' || !text) return;
    sendMessage(text, true, original.image || null, { base: messages.slice(0, index), keepMessages: savedCountBefore(index) });
  };

  const retryAt = (index) => {
    if (isStreaming) return;
    const answer = messages[index];
    const question = messages[index - 1];
    if (!answer || question?.role !== 'user') return;
    const text = answer.retry?.text ?? question.content;
    const photo = answer.retry ? answer.retry.photo : question.image || null;
    const regenerate = !answer.isError && !answer.cancelled;
    sendMessage(text, true, photo, { base: messages.slice(0, index - 1), regenerate, keepMessages: savedCountBefore(index - 1) });
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
    stopSpeaking(); // do not let the tutor's voice be picked up by the mic
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
      if (spoken) voiceUsedRef.current = true;
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

  // ---- Share / export the whole chat --------------------------------------------------------
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef(null);
  useEffect(() => {
    if (!exportOpen) return undefined;
    const onDown = (e) => { if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setExportOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [exportOpen]);

  // Real conversation only: no welcome text, no failed or still-loading answers.
  const exportable = messages.filter((m, i) => !(i === 0 && m.role === 'assistant') && m.content?.trim() && !m.isError && !m._streamingId);
  const chatTitle = (exportable.find((m) => m.role === 'user')?.content || 'AdaptUAI chat').replace(/\s+/g, ' ').slice(0, 60);
  const fileBase = 'adaptuai-chat-' + (chatTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'export');
  const nowText = () => new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  const stamp = (m) => (m.timestamp ? new Date(m.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '');

  const buildText = () => [
    'AdaptUAI chat: ' + chatTitle,
    'Exported ' + nowText(),
    '',
    ...exportable.map((m) => {
      const who = m.role === 'user' ? 'You' : 'AdaptUAI Tutor';
      const photo = m.image ? (m.image.startsWith('http') ? m.image : '[photo attached]') + '\n' : '';
      return who + ' (' + stamp(m) + '):\n' + photo + m.content.trim() + (m.cancelled ? '\n[stopped]' : '') + '\n';
    }),
  ].join('\n');

  const buildMarkdown = () => [
    '# ' + chatTitle,
    '_Exported from AdaptUAI on ' + nowText() + '_',
    '',
    ...exportable.map((m) => {
      const who = m.role === 'user' ? '🧑 **You**' : '🦉 **AdaptUAI Tutor**';
      const img = m.image?.startsWith('http') ? '![Attached photo](' + m.image + ')\n\n' : m.image ? '_[photo attached]_\n\n' : '';
      return '### ' + who + ' · ' + stamp(m) + '\n\n' + img + m.content.trim() + (m.cancelled ? '\n\n_[stopped]_' : '') + '\n\n---\n';
    }),
  ].join('\n');

  const downloadFile = (content, ext, type) => {
    const url = URL.createObjectURL(new Blob([content], { type: type + ';charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = fileBase + '.' + ext;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const exportAction = async (kind) => {
    setExportOpen(false);
    if (!exportable.length) { toast.info('Ask something first. There is nothing to export yet.'); return; }
    try {
      if (kind === 'txt') { downloadFile(buildText(), 'txt', 'text/plain'); toast.success('Chat downloaded'); }
      else if (kind === 'md') { downloadFile(buildMarkdown(), 'md', 'text/markdown'); toast.success('Chat exported as Markdown'); }
      else if (kind === 'copy') { await navigator.clipboard.writeText(buildText()); toast.success('Chat copied'); }
      else if (kind === 'share') {
        const text = buildText();
        if (navigator.share) await navigator.share({ title: 'AdaptUAI: ' + chatTitle, text });
        else { await navigator.clipboard.writeText(text); toast.success('Sharing is not available here, so the chat was copied'); }
      }
    } catch (err) {
      if (err?.name !== 'AbortError') toast.error('Could not complete that. Please try again.');
    }
  };

  const EXPORT_ACTIONS = [
    { id: 'share', label: 'Share chat', icon: Share2 },
    { id: 'copy', label: 'Copy chat', icon: Copy },
    { id: 'txt', label: 'Download as .txt', icon: Download },
    { id: 'md', label: 'Export as Markdown', icon: FileText },
  ];

  const handleNewChat = () => {
    abortControllerRef.current?.abort();
    stopSpeaking();
    voiceUsedRef.current = false;
    setSessionId(uuidv4());
    setMessages([
      {
        role: 'assistant',
        welcome: true,
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
      <div className="flex-shrink-0 flex items-center justify-between gap-2 px-2 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-4 border-b border-surface-200 bg-surface-50">
        <div className="flex min-w-0 items-center gap-2">
          {/* Phones: the navbar is hidden on this page, so give a way back */}
          <Link
            href="/user/dashboard"
            aria-label="Back"
            title="Back"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-surface-900 transition-colors hover:bg-surface-100 lg:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
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
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleNewChat}
            aria-label="New chat"
            title="New chat"
            className="flex h-9 w-9 items-center justify-center gap-1.5 rounded-full bg-surface-100 text-sm font-semibold text-surface-900 outline-none transition-colors hover:bg-surface-200 focus-visible:ring-2 focus-visible:ring-brand-500 sm:w-auto sm:px-3"
          >
            <SquarePen className="h-4 w-4" /> <span className="hidden sm:inline">New chat</span>
          </button>

          {speechOk && (
            <div className="group relative">
              <button
                type="button"
                onClick={toggleReadAloud}
                aria-pressed={readAloud}
                aria-label={readAloud ? 'Read aloud is on' : 'Read answers aloud'}
                className={`flex h-9 w-9 items-center justify-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 ${readAloud ? 'bg-brand-500 text-white hover:brightness-110' : 'bg-surface-100 text-surface-900 hover:bg-surface-200'}`}
              >
                {readAloud ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
              <span
                role="tooltip"
                className="pointer-events-none absolute right-1/2 top-full z-30 mt-1.5 hidden translate-x-1/2 whitespace-nowrap rounded-md bg-surface-900 px-2 py-1 text-xs font-medium text-surface-50 opacity-0 shadow-menu transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 lg:block"
              >
                {readAloud ? 'Read aloud: on' : 'Read answers aloud'}
              </span>
            </div>
          )}

          {/* Desktop: the export actions as direct icon buttons with a tooltip */}
          <div className="hidden items-center gap-1.5 lg:flex">
            {EXPORT_ACTIONS.map(({ id, label, icon: Icon }) => (
              <div key={id} className="group relative">
                <button
                  type="button"
                  onClick={() => exportAction(id)}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-100 text-surface-900 outline-none transition-colors hover:bg-surface-200 focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  <Icon className="h-4 w-4" />
                </button>
                <span
                  role="tooltip"
                  className="pointer-events-none absolute right-1/2 top-full z-30 mt-1.5 translate-x-1/2 whitespace-nowrap rounded-md bg-surface-900 px-2 py-1 text-xs font-medium text-surface-50 opacity-0 shadow-menu transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
                >
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Phones/tablets: the same actions in a ⋮ menu */}
          <div className="relative lg:hidden" ref={exportRef}>
            <button
              type="button"
              onClick={() => setExportOpen((o) => !o)}
              aria-label="Share or export chat"
              title="Share or export chat"
              aria-expanded={exportOpen}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-100 text-surface-900 outline-none transition-colors hover:bg-surface-200 focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-11 z-30 w-56 rounded-lg bg-surface-50 p-1.5 shadow-menu animate-fade-in" role="menu">
                {EXPORT_ACTIONS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    role="menuitem"
                    onClick={() => exportAction(id)}
                    className="flex w-full items-center gap-3 rounded-lg p-2 text-left text-sm font-medium text-surface-900 transition-colors hover:bg-surface-100"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-100"><Icon className="h-4 w-4" /></span>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
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
                onEdit={msg.role === 'user' && !isStreaming ? (text) => editAt(i, text) : undefined}
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
        {/* Answer style */}
        <div className="mb-1.5 flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-wrap lg:overflow-visible" role="radiogroup" aria-label="Answer style">
          {MODE_CHIPS.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={mode === m.id}
              onClick={() => chooseMode(m.id)}
              title={m.hint}
              className={`h-7 shrink-0 rounded-full px-2.5 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 ${mode === m.id ? 'bg-brand-500/15 text-brand-600' : 'bg-surface-100 text-surface-900 hover:bg-surface-200'}`}
            >
              {m.label}
            </button>
          ))}
        </div>
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
            onChange={(e) => {
              setInput(e.target.value);
              if (!e.target.value.trim()) voiceUsedRef.current = false;
            }}
            onKeyDown={handleKeyDown}
            placeholder={listening ? 'Listening… speak now' : MODE_CHIPS.find((c) => c.id === mode)?.placeholder || 'Ask anything…'}
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
          <span className="hidden sm:inline">Enter to send · Shift+Enter for a new line · </span>{process.env.NEXT_PUBLIC_EACH_CHAT_AU_TOKEN || 10} AU per answer · AI can make mistakes
        </p>
      </div>
    </div>
  );
}
