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
    <div className="flex bg-surface-50 min-h-screen">
      <Sidebar user={user} />

      <main className="flex-1 lg:pl-0 h-screen pt-16 flex flex-col">
        <div className="flex-1 max-w-4xl mx-auto w-full h-full border-x border-surface-100 bg-surface-50">
          <ChatBox user={user} initialSessionId={sessionId} onSuccess={fetchUser} />
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
