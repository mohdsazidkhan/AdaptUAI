'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/Card';
import { PageLoader } from '@/components/Loader';
import api from '@/lib/api';
import Link from 'next/link';

export default function AdminChats() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChats() {
      try {
        const response = await api.get('/admin/chats');
        setChats(response.chats);
      } catch (err) {
        console.error('Failed to fetch admin chats:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchChats();
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="p-4 lg:p-8 container mx-auto">
      <header className="mb-8">
        <h1 className="text-xl lg:text-3xl font-black text-surface-900 dark:text-white">Users Chat History</h1>
        <p className="text-surface-500 font-bold mt-2">Monitor all student AI teaching interactions across the system</p>
      </header>

      <div className="space-y-4">
        {chats.map((chat) => (
          <Card key={chat._id} padding="lg" className="hover:border-brand-300 transition-all border-surface-200">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="text-3xl">🤖</div>
                <div>
                  <h3 className="font-black text-surface-900 dark:text-white leading-tight mb-1">{chat.title}</h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs">
                    <span className="font-bold text-brand-600 dark:text-brand-400">User: {chat.userId?.name || 'Unknown'}</span>
                    <span className="text-surface-400 dark:text-surface-500 hidden sm:inline">({chat.userId?.email})</span>
                    <span className="bg-surface-100 dark:bg-surface-800 px-2 py-0.5 rounded text-surface-500 dark:text-surface-400 w-fit mt-1 sm:mt-0">
                      {new Date(chat.updatedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-surface-100 dark:border-surface-800">
                <span className="text-[10px] font-black uppercase text-surface-400 dark:text-surface-500 px-2 py-1 bg-surface-100 dark:bg-surface-800 rounded">
                  {chat.messages?.length || 0} Messages
                </span>
                <Link
                  href={`/admin/chats/${chat.sessionId}`}
                  className="px-4 py-2 bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/10 dark:hover:bg-brand-900/20 text-brand-600 rounded-xl text-xs font-black uppercase tracking-widest transition-colors sm:bg-transparent sm:hover:bg-transparent sm:dark:bg-transparent sm:dark:hover:bg-transparent sm:p-0 sm:text-brand-500 sm:hover:text-brand-600"
                >
                  <span className="sm:hidden">View Details</span>
                  <span className="hidden sm:inline">View Details →</span>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
