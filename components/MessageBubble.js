'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, Share2 } from 'lucide-react';
import { TypingIndicator } from './Loader';
import { toast } from 'react-toastify';

function formatTime(date) {
  if (!date) return '';
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({ message, compact = false }) {
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
            <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold text-xs shadow-sm shadow-brand-500/20">
              YOU
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-ocean-500 flex items-center justify-center shadow-sm shadow-ocean-500/20">
              <span className="text-base">🦉</span>
            </div>
          )}
        </div>
      )}

      {/* Bubble */}
      <div className={`max-w-[85%] md:max-w-[70%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1.5 group`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm transition-all duration-200 ${isUser
              ? 'bg-brand-500 text-white rounded-tr-sm border-brand-600 shadow-md shadow-brand-500/20'
              : 'bg-surface-50 dark:bg-surface-100 text-surface-900 rounded-tl-sm border border-surface-200 dark:border-surface-200/20 hover:border-brand-200'
            }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words font-medium">{message.content}</p>
          ) : (
            <div className="prose dark:prose-invert prose-sm max-w-none prose-headings:text-surface-900 prose-p:text-surface-800 prose-code:bg-surface-100 prose-code:rounded prose-code:px-1 prose-pre:bg-surface-900 prose-pre:text-brand-300 prose-strong:text-surface-900 prose-a:text-brand-600">
              {!message.content || message.content.trim() === '' ? (
                <TypingIndicator />
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              )}
            </div>
          )}
        </div>

        {/* Footer info & Actions */}
        <div className={`flex items-center gap-3 px-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Timestamp */}
          {message.timestamp && (
            <span className="text-[10px] text-surface-400 font-bold uppercase tracking-tighter">
              {formatTime(message.timestamp)}
            </span>
          )}

          {/* AI Message specific actions */}
          {!isUser && message.content && message.content.trim() !== '' && (
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-surface-100 border border-surface-200 rounded-full px-2 py-0.5">
              <button 
                onClick={handleCopy}
                title="Copy response"
                className="p-1 text-surface-400 hover:text-brand-500 transition-colors"
                aria-label="Copy"
              >
                {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
