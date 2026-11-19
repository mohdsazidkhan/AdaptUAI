'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, Share2, RotateCcw, Square } from 'lucide-react';
import WaitingWord from './WaitingWord';
import { toast } from 'react-toastify';

function formatTime(date) {
  if (!date) return '';
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// onRetry: shown as "Retry" on a failed/stopped answer, "Regenerate" on the latest finished one.
// onStop: given while this answer is streaming.
export default function MessageBubble({ message, compact = false, onRetry, onStop }) {
  const [copied, setCopied] = useState(false);
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
          {isUser ? (
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
            <div className="prose dark:prose-invert prose-sm max-w-none prose-headings:text-surface-900 prose-p:text-surface-800 prose-code:bg-surface-100 prose-code:rounded prose-code:px-1 prose-pre:bg-surface-900 prose-pre:text-brand-300 prose-strong:text-surface-900 prose-a:text-brand-600">
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
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
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
