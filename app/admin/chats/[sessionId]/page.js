'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/Card';
import { PageLoader } from '@/components/Loader';
import api from '@/lib/api';
import Link from 'next/link';

export default function AdminChatView() {
  const { sessionId } = useParams();
  const router = useRouter();
  const [chat, setChat] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChat() {
      try {
        const response = await api.get(`/admin/chats/${sessionId}`);
        setChat(response.chat);
      } catch (err) {
        console.error('Failed to fetch admin chat:', err);
      } finally {
        setLoading(false);
      }
    }
    if (sessionId) fetchChat();
  }, [sessionId]);

  if (loading) return <PageLoader />;
  if (!chat) return (
    <div className="p-8 text-center bg-surface-50 dark:bg-transparent rounded-3xl border-2 border-dashed border-surface-200 dark:border-surface-100/10">
      <p className="text-surface-500 font-bold">Chat session not found.</p>
      <Link href="/admin/chats" className="mt-4 inline-block text-brand-500 font-black">← Back to History</Link>
    </div>
  );

  return (
    <div className="p-4 lg:-8 container mx-auto space-y-8 animate-fade-in">
      <header className="flex items-center justify-between">
        <div>
          <Link href="/admin/chats" className="text-xs font-black text-surface-400 hover:text-brand-500 uppercase tracking-widest mb-2 inline-block transition-colors">
            ← Back to Users Chat
          </Link>
          <h1 className="text-xl lg:text-3xl font-black text-surface-900 dark:text-white leading-tight">{chat.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-2">
              <img src={chat.userId?.avatarUrl} className="w-6 h-6 rounded-full border border-surface-200" alt="" />
              <span className="text-sm font-bold text-green-400">{chat.userId?.name}</span>
            </div>
            <span className="text-surface-300 dark:text-surface-700">|</span>
            <span className="text-xs font-bold text-surface-400 uppercase tracking-widest">{new Date(chat.createdAt).toLocaleString()}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="px-3 py-1 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-brand-100 dark:border-brand-500/20">
            Read Only
          </span>
        </div>
      </header>

      <div className="space-y-6">
        {chat.messages?.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-4 ${msg.role === 'assistant' ? 'bg-surface-50 dark:bg-surface-100/20 p-2 lg:p-6 rounded-xl lg:rounded-3xl border border-surface-100 dark:border-surface-100/5' : 'px-0 lg:px-6 py-4'}`}
          >
            <div className="text-2xl mt-1 shrink-0">
              {msg.role === 'assistant' ? '🤖' : '👤'}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${msg.role === 'assistant' ? 'text-brand-600 dark:text-brand-400' : 'text-surface-400 dark:text-surface-500'}`}>
                {msg.role === 'assistant' ? 'AI Instructor' : chat.userId?.name}
              </p>
              <div className="prose dark:prose-invert max-w-none text-surface-900 dark:text-surface-900 font-bold leading-relaxed whitespace-pre-wrap antialiased">
                {msg.content}
              </div>
            </div>
          </div>
        ))}
      </div>

      <footer className="pt-12 border-t border-surface-100 dark:border-surface-100/10 text-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-surface-400">End of Session Transcript</p>
        <Link
          href="/admin/chats"
          className="mt-6 inline-flex items-center gap-2 px-8 py-4 bg-surface-900 dark:bg-surface-100 text-white dark:text-white rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-xl shadow-surface-900/10 dark:shadow-black/20 border border-surface-800 dark:border-surface-100/10"
        >
          Return to History
        </Link>
      </footer>
    </div>
  );
}
