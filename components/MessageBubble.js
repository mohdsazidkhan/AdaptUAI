'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { TypingIndicator } from './Loader';

function formatTime(date) {
  if (!date) return '';
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({ message, compact = false }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) return null;

  return (
    <div
      className={`flex items-end gap-2 mb-4 animate-fade-in ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar */}
      {!compact && (
        <div className="flex-shrink-0 mb-1">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              YOU
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center shadow-sm">
              <span className="text-base">🦉</span>
            </div>
          )}
        </div>
      )}

      {/* Bubble */}
      <div className={`max-w-[85%] md:max-w-[70%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
            isUser
              ? 'bg-brand-500 text-white rounded-tr-sm border-brand-600 shadow-md shadow-brand-500/20'
              : 'bg-surface-50 dark:bg-surface-100 text-surface-900 rounded-tl-sm border border-surface-200 dark:border-surface-200/20'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words font-medium">{message.content}</p>
          ) : (
            <div className="prose dark:prose-invert prose-sm max-w-none prose-headings:text-surface-900 prose-p:text-surface-800 prose-code:bg-surface-100 prose-code:rounded prose-code:px-1 prose-pre:bg-surface-900 prose-pre:text-green-300 prose-strong:text-surface-900 prose-a:text-brand-600">
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

        {/* Timestamp */}
        {message.timestamp && (
          <span className={`text-[10px] text-surface-400 px-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {formatTime(message.timestamp)}
          </span>
        )}
      </div>
    </div>
  );
}
