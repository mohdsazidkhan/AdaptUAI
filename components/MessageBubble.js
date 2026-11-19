'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';

const REMARK_PLUGINS = [remarkGfm, remarkMath];
const REHYPE_PLUGINS = [[rehypeKatex, { throwOnError: false, strict: false }], [rehypeHighlight, { detect: true }]];

// Models also write LaTeX as \( … \) and \[ … \]; turn those into the $ / $$ form remark-math reads.
function normalizeMath(text) {
  return String(text || '')
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, m) => `\n$$\n${m.trim()}\n$$\n`)
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, m) => `$${m.trim()}$`);
}
import { Copy, Check, Share2, RotateCcw, Square, Pencil } from 'lucide-react';
import WaitingWord from './WaitingWord';
import { toast } from 'react-toastify';

function formatTime(date) {
  if (!date) return '';
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// onRetry: shown as "Retry" on a failed/stopped answer, "Regenerate" on the latest finished one.
// onStop: given while this answer is streaming.
export default function MessageBubble({ message, compact = false, onRetry, onStop, onEdit }) {
  const [copied, setCopied] = useState(false);
  // Editing a sent question (onEdit is given for the learner's own messages)
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const startEdit = () => { setDraft(message.content || ''); setEditing(true); };
  const submitEdit = () => {
    const text = draft.trim();
    if (!text) return;
    setEditing(false);
    if (text !== (message.content || '').trim()) onEdit?.(text);
  };
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'AdaptUAI Tutor Response',
      text: message.content,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text}\n\nShared from AdaptUAI: ${shareData.url}`);
        toast.info('Link/Content copied to share! 🚀');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  return (
    <div
      className={`flex items-end gap-2 mb-4 animate-fade-in ${isUser ? 'flex-row-reverse' : 'flex-row'
        }`}
    >
      {/* Avatar */}
      {!compact && (
        <div className="flex-shrink-0 mb-1">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold text-xs">
              YOU
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center">
              <span className="text-base">🦉</span>
            </div>
          )}
        </div>
      )}

      {/* Bubble */}
      <div className={`max-w-[85%] md:max-w-[70%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1.5 group`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed transition-all duration-200 ${isUser
              ? 'bg-brand-500 text-white rounded-tr-sm'
              : 'bg-surface-100 text-surface-900 rounded-tl-sm'
            }`}
        >
          {isUser && editing ? (
            <div className="w-[min(70vw,520px)]">
              <label htmlFor={`edit-${message.timestamp}`} className="sr-only">Edit your message</label>
              <textarea
                id={`edit-${message.timestamp}`}
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submitEdit(); }
                  if (e.key === 'Escape') setEditing(false);
                }}
                rows={Math.min(8, Math.max(2, draft.split('\n').length))}
                maxLength={4000}
                className="block w-full resize-y rounded-lg border-0 bg-white/95 px-3 py-2 text-sm text-[#050505] outline-none focus:ring-2 focus:ring-white"
              />
              <div className="mt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setEditing(false)} className="h-8 rounded-full bg-white/20 px-3 text-xs font-semibold text-white transition hover:bg-white/30">
                  Cancel
                </button>
                <button type="button" onClick={submitEdit} disabled={!draft.trim()} className="h-8 rounded-full bg-white px-3 text-xs font-semibold text-brand-600 transition hover:brightness-95 disabled:opacity-50">
                  Send
                </button>
              </div>
            </div>
          ) : isUser ? (
            <>
              {message.image && (
                <a href={message.image.startsWith('data:') ? undefined : message.image} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={message.image} alt="Attached image" className="mb-2 max-h-48 w-auto rounded-lg bg-white/10 object-contain" />
                </a>
              )}
              <p className="whitespace-pre-wrap break-words font-medium">{message.content}</p>
            </>
          ) : (
            <div className="prose dark:prose-invert prose-sm max-w-none prose-headings:text-surface-900 prose-p:text-surface-800 prose-code:bg-surface-50 prose-code:rounded prose-code:px-1 prose-code:before:content-none prose-code:after:content-none prose-pre:bg-[#0d1117] prose-pre:text-[#e6edf3] prose-pre:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_.katex-display]:overflow-x-auto [&_.katex-display]:py-1 prose-strong:text-surface-900 prose-a:text-brand-600">
              {!message.content || message.content.trim() === '' ? (
                message.cancelled ? (
                  <p className="not-prose text-surface-500">You stopped this answer.</p>
                ) : (
                  <>
                    <WaitingWord />
                    {onStop && (
                      <button
                        type="button"
                        onClick={onStop}
                        className="not-prose mt-2 inline-flex h-8 items-center gap-1.5 rounded-full bg-surface-50 px-3 text-xs font-semibold text-surface-900 transition-colors hover:bg-surface-200"
                      >
                        <Square className="h-3 w-3 fill-current" /> Stop
                      </button>
                    )}
                  </>
                )
              ) : (
                <ReactMarkdown remarkPlugins={REMARK_PLUGINS} rehypePlugins={REHYPE_PLUGINS}>
                  {normalizeMath(message.content)}
                </ReactMarkdown>
              )}
              {message.cancelled && message.content?.trim() && (
                <p className="not-prose mt-2 text-xs font-semibold text-surface-500">Stopped</p>
              )}
            </div>
          )}
        </div>

        {/* Footer info & Actions */}
        <div className={`flex items-center gap-3 px-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Timestamp */}
          {message.timestamp && (
            <span className="text-xs text-surface-400 font-bold uppercase">
              {formatTime(message.timestamp)}
            </span>
          )}

          {/* Learner's message: Edit, then resend */}
          {isUser && onEdit && !editing && (
            <button
              type="button"
              onClick={startEdit}
              title="Edit message"
              aria-label="Edit message"
              className="flex h-7 w-7 items-center justify-center rounded-full text-surface-400 transition-colors hover:bg-surface-100 hover:text-brand-500 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Failed or stopped answer: a clear Retry button, always visible */}
          {!isUser && onRetry && (message.isError || message.cancelled) && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-brand-500 px-3 text-xs font-semibold text-white transition hover:brightness-110"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Retry
            </button>
          )}

          {/* AI Message specific actions */}
          {!isUser && !message.isError && message.content && message.content.trim() !== '' && (
            <div className="flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 bg-surface-100 border border-surface-200 rounded-full px-2 py-0.5">
              <button 
                onClick={handleCopy}
                title="Copy response"
                className="p-1 text-surface-400 hover:text-brand-500 transition-colors"
                aria-label="Copy"
              >
                {copied ? <Check size={12} className="text-brand-600" /> : <Copy size={12} />}
              </button>
              <div className="w-px h-2.5 bg-surface-200" />
              <button 
                onClick={handleShare}
                title="Share response"
                className="p-1 text-surface-400 hover:text-brand-500 transition-colors"
                aria-label="Share"
              >
                <Share2 size={12} />
              </button>
              {onRetry && !message.cancelled && (
                <>
                  <div className="w-px h-2.5 bg-surface-200" />
                  <button
                    onClick={onRetry}
                    title="Regenerate answer"
                    className="p-1 text-surface-400 hover:text-brand-500 transition-colors"
                    aria-label="Regenerate answer"
                  >
                    <RotateCcw size={12} />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
