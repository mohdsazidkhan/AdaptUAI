'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessagesSquare, ChevronRight, SquarePen } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { PageLoader } from '@/components/Loader';
import { PageHeader, SearchField, Pill, EmptyState, card, brandBtn, fmtDateTime } from '@/components/admin/ui';

export default function ChatHistoryPage() {
  const router = useRouter();
  const [chats, setChats] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [profileRes, chatsRes] = await Promise.all([fetch('/api/user/profile'), fetch('/api/user/chats')]);
        if (profileRes.status === 401) {
          router.push('/auth/login?callbackUrl=/user/chats');
          return;
        }
        const [profileData, chatsData] = await Promise.all([profileRes.json(), chatsRes.json()]);
        if (profileData.success) setUser(profileData.user);
        if (chatsData.success) setChats(chatsData.chats || []);
      } catch (err) {
        console.error('Failed to fetch chat history:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [router]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? chats.filter((c) => [c.title, c.topic, c.preview].some((v) => v?.toLowerCase().includes(q))) : chats;
  }, [chats, query]);

  if (loading) return <PageLoader />;

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />

      <main className="flex-1 min-w-0 lg:ml-sidebar pt-navbar *:mx-auto *:w-full *:max-w-page *:p-3 lg:*:p-4 app-content">
        <div className="table-page self-padded animate-fade-in">
          <PageHeader
            title="Recent Chats"
            count={chats.length}
            search={<SearchField value={query} onChange={setQuery} placeholder="Search your chats" label="Search chats" />}
            actions={<Link href="/user/chat" className={brandBtn}><SquarePen className="h-4 w-4" /> New chat</Link>}
          />

          <section className={`${card} table-scroll`}>
            {shown.length === 0 ? (
              query ? (
                <EmptyState icon={MessagesSquare} title="No chats match your search" text="Try another word from the title or topic." />
              ) : (
                <div className="flex min-h-full flex-col items-center justify-center gap-3 px-4 py-12 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-3xl">🦉</span>
                  <p className="font-semibold text-surface-900">No chats yet</p>
                  <p className="text-sm text-surface-500">Ready to start your first session?</p>
                  <Link href="/user/chat" className={brandBtn}>Start learning</Link>
                </div>
              )
            ) : (
              <ul className="divide-y divide-surface-200">
                {shown.map((chat) => (
                  <li key={chat.sessionId}>
                    <Link href={`/user/chat?sessionId=${chat.sessionId}`} className="flex items-center gap-3 p-3 transition-colors hover:bg-surface-100 sm:p-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-600">
                        <MessagesSquare className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-semibold text-surface-900">{chat.title || 'Untitled chat'}</p>
                        {chat.preview && <p className="truncate text-sm text-surface-500">{chat.preview}</p>}
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <Pill>{chat.messageCount || 0} messages</Pill>
                          {chat.topic && chat.topic !== chat.title && <Pill tone="brand">{chat.topic}</Pill>}
                          <span className="text-xs text-surface-500">{fmtDateTime(chat.updatedAt)}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 shrink-0 text-surface-500" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
