'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Card from '@/components/Card';
import { PageLoader } from '@/components/Loader';

export default function ChatHistoryPage() {
  const router = useRouter();
  const [chats, setChats] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [profileRes, chatsRes] = await Promise.all([
          fetch('/api/user/profile'),
          fetch('/api/user/chats')
        ]);

        if (profileRes.status === 401) {
          router.push('/auth/login?callbackUrl=/chats');
          return;
        }

        const [profileData, chatsData] = await Promise.all([
          profileRes.json(),
          chatsRes.json()
        ]);

        if (profileData.success) setUser(profileData.user);
        if (chatsData.success) setChats(chatsData.chats);
      } catch (err) {
        console.error('Failed to fetch chat history:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <PageLoader />;

  return (
    <div className="flex bg-surface-50 min-h-screen">
      <Sidebar user={user} />

      <main className="flex-1 pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="animate-fade-in">
          <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-surface-900">Recent Chats</h1>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-surface-500 font-semibold">
                  Your historical learning sessions
                </p>
                <span className="text-surface-300">•</span>
                <Link href="/transactions" className="text-[10px] font-black uppercase text-brand-600 hover:text-brand-700 hover:underline tracking-widest flex items-center gap-1">
                  <span>📜</span> Transaction History
                </Link>
              </div>
            </div>
            <Link href="/chat">
              <button className="px-6 py-3 bg-brand-500 text-white rounded-2xl font-black shadow-lg shadow-brand-500/20 hover:scale-105 transition-all text-sm">
                + Start New Chat
              </button>
            </Link>
          </header>

          {chats.length === 0 ? (
            <Card className="text-center py-16 border-dashed border-2 border-surface-200 bg-surface-100/30">
              <div className="text-5xl mb-4 grayscale opacity-50">🦉</div>
              <h3 className="text-xl font-black text-surface-900 mb-2">No Chat History Found</h3>
              <p className="text-surface-500 font-medium mb-8">Ready to start your first session?</p>
              <Link href="/chat">
                <button className="px-8 py-4 bg-brand-500 text-white rounded-2xl font-black shadow-lg hover:shadow-xl transition-all">
                  Let's Begin 🚀
                </button>
              </Link>
            </Card>
          ) : (
            <div className="space-y-4">
              {chats.map((chat) => (
                <Card key={chat.sessionId} padding="none" className="overflow-hidden group hover:border-brand-300 transition-all hover:translate-x-1 shadow-sm">
                  <Link href={`/chat?sessionId=${chat.sessionId}`} className="flex items-stretch">
                    <div className="w-16 bg-surface-100 flex flex-col items-center justify-center border-r border-surface-200 group-hover:bg-brand-50 group-hover:border-brand-200 transition-colors">
                      <span className="text-2xl mb-1">🦉</span>
                      <span className="text-[10px] font-black text-surface-400 group-hover:text-brand-500">{chat.messageCount}</span>
                    </div>
                    
                    <div className="flex-1 p-5">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-black text-surface-900 group-hover:text-brand-700 transition-colors">
                          {chat.title}
                        </h4>
                        <span className="text-[10px] font-bold text-surface-400 uppercase tracking-widest whitespace-nowrap ml-4">
                          {formatDate(chat.updatedAt)}
                        </span>
                      </div>
                      <p className="text-xs text-surface-500 line-clamp-1 font-medium italic">
                        "{chat.preview}"
                      </p>
                    </div>

                    <div className="px-6 flex items-center justify-center bg-surface-50 group-hover:bg-brand-500 transition-colors">
                      <svg className="w-5 h-5 text-brand-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
