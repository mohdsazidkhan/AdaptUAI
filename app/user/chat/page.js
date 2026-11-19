'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import ChatBox from '@/components/ChatBox';
import { PageLoader } from '@/components/Loader';
import api from '@/lib/api';

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const data = await api.get('/user/profile');
      setUser(data.user);
    } catch (err) {
      console.error('Failed to fetch user for chat:', err);
      // Global interceptor handles 401 redirect, so we only handle other errors
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />

      <main className="flex-1 min-w-0 overflow-hidden lg:ml-sidebar h-screen h-[100dvh] lg:pt-navbar flex flex-col">
        <div className="mx-auto flex w-full max-w-page flex-1 min-h-0 flex-col lg:p-4">
          <div className="flex-1 min-h-0 overflow-hidden bg-surface-50 lg:rounded-lg lg:shadow-card">
            <ChatBox user={user} initialSessionId={sessionId} onSuccess={fetchUser} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ChatContent />
    </Suspense>
  );
}
