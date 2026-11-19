'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessagesSquare, SquarePen, ChevronRight } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { PageLoader } from '@/components/Loader';
import { PageHeader, SearchField, Pill, IconButton, brandBtn, fmtDateTime } from '@/components/admin/ui';
import DataView, { ViewToggle } from '@/components/admin/DataView';
import { useViewMode } from '@/components/admin/useAdminList';

export default function ChatHistoryPage() {
  const router = useRouter();
  const [chats, setChats] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [view, setView] = useViewMode('user-chats');

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

  const open = (c) => router.push(`/user/chat?sessionId=${c.sessionId}`);

  const columns = [
    {
      key: 'chat', header: 'Chat', primary: true,
      render: (c) => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-brand-600">
            <MessagesSquare className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-surface-900">{c.title || 'Untitled chat'}</p>
            {c.preview && <p className="truncate text-xs text-surface-500">{c.preview}</p>}
          </div>
        </div>
      ),
    },
    { key: 'topic', header: 'Topic', render: (c) => (c.topic && c.topic !== c.title ? <Pill tone="brand">{c.topic}</Pill> : <span className="text-surface-500">–</span>) },
    { key: 'messages', header: 'Messages', align: 'center', render: (c) => <Pill>{c.messageCount || 0}</Pill> },
    { key: 'updated', header: 'Last activity', className: 'whitespace-nowrap text-surface-500', render: (c) => fmtDateTime(c.updatedAt) },
    {
      key: 'actions', header: 'Open', actions: true, align: 'right',
      render: (c) => <div className="flex justify-end"><IconButton icon={ChevronRight} label="Open chat" tip="top" href={`/user/chat?sessionId=${c.sessionId}`} /></div>,
    },
  ];

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
            filters={<ViewToggle view={view} onChange={setView} />}
            actions={<Link href="/user/chat" className={brandBtn}><SquarePen className="h-4 w-4" /> New chat</Link>}
          />

          <section className="fb-card table-scroll">
            {chats.length === 0 ? (
              <div className="flex min-h-full flex-col items-center justify-center gap-3 px-4 py-12 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-3xl">🦉</span>
                <p className="font-semibold text-surface-900">No chats yet</p>
                <p className="text-sm text-surface-500">Ready to start your first session?</p>
                <Link href="/user/chat" className={brandBtn}>Start learning</Link>
              </div>
            ) : (
              <DataView
                view={view}
                columns={columns}
                rows={shown}
                rowKey={(c) => c.sessionId}
                onRowClick={open}
                empty={{ icon: MessagesSquare, title: 'No chats match your search', text: 'Try another word from the title or topic.' }}
              />
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
