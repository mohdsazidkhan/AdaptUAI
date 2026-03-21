'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import ChatBox from '@/components/ChatBox';
import { PageLoader } from '@/components/Loader';

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/user/profile');
        if (res.status === 401) {
          router.push('/auth/login?callbackUrl=/chat');
          return;
        }
        const json = await res.json();
        if (json.success) {
          setUser(json.user);
        }
      } catch (err) {
        console.error('Failed to fetch user for chat:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="flex bg-surface-50 min-h-screen">
      <Sidebar user={user} />

      <main className="flex-1 lg:pl-0 h-screen pt-16 flex flex-col">
        <div className="flex-1 max-w-4xl mx-auto w-full h-full border-x border-surface-100 bg-surface-50">
          <ChatBox user={user} initialSessionId={sessionId} />
        </div>
      </main>
    </div>
  );
}
