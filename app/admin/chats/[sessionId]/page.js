'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MessagesSquare } from 'lucide-react';
import MessageBubble from '@/components/MessageBubble';
import api from '@/lib/api';
import { avatarFor } from '@/lib/navItems';
import { PageHeader, Pill, EmptyState, ListSkeleton, card, greyBtn, fmtDateTime } from '@/components/admin/ui';

export default function AdminChatView() {
  const { sessionId } = useParams();
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

  const back = { href: '/admin/chats', label: 'Users Chat' };

  if (loading) {
    return (
      <div className="space-y-3 lg:space-y-4">
        <PageHeader title="Chat transcript" back={back} />
        <section className={card}><ListSkeleton rows={5} /></section>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="space-y-3 lg:space-y-4">
        <PageHeader title="Chat transcript" back={back} />
        <section className={card}>
          <EmptyState icon={MessagesSquare} title="Chat session not found" text="It may have been deleted." />
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-3 lg:space-y-4">
      <PageHeader
        title={chat.title || 'Chat transcript'}
        back={back}
        subtitle={`Started ${fmtDateTime(chat.createdAt)} · last activity ${fmtDateTime(chat.updatedAt)}`}
        actions={<Pill>Read only</Pill>}
      />

      {/* Learner */}
      <section className={`${card} flex flex-wrap items-center gap-3 p-3 sm:p-4`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatarFor(chat.userId)} alt="" className="h-10 w-10 rounded-full bg-surface-100 object-cover" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-surface-900">{chat.userId?.name || 'Unknown user'}</p>
          <p className="truncate text-sm text-surface-500">{chat.userId?.email}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Pill>{chat.messages?.length || 0} messages</Pill>
          {chat.topic && <Pill tone="brand">{chat.topic}</Pill>}
          {chat.auEarned > 0 && <Pill tone="accent">{chat.auEarned} AU used</Pill>}
        </div>
      </section>

      {/* Transcript: same bubbles the learner saw */}
      <section className={`${card} space-y-3 p-3 sm:p-4`}>
        {chat.messages?.length ? (
          chat.messages.map((msg, idx) => <MessageBubble key={msg._id || idx} message={msg} />)
        ) : (
          <EmptyState icon={MessagesSquare} title="No messages in this chat" />
        )}
        <div className="border-t border-surface-200 pt-3 text-center">
          <p className="mb-2 text-sm text-surface-500">End of transcript</p>
          <Link href="/admin/chats" className={greyBtn}>Back to all chats</Link>
        </div>
      </section>
    </div>
  );
}
