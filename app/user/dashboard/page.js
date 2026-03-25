'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Card from '@/components/Card';
import AUBadge from '@/components/AUBadge';
import ProgressBar from '@/components/ProgressBar';
import { PageLoader } from '@/components/Loader';
import Button from '@/components/Button';
import api from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await api.get('/user/profile');
        setData(data);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <PageLoader />;

  const { user, stats, recentChats } = data || {};

  return (
    <div className="flex bg-surface-50 min-h-screen">
      <Sidebar user={user} />

      <main className="flex-1 lg:ml-64 pt-24 pb-12 px-4 sm:px-6 lg:px-8 container mx-auto">
        <div className="animate-fade-in">
          {/* Welcome Header */}
          <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl lg:text-3xl font-black text-surface-900 dark:text-white">
                Hi, {user?.name?.split(' ')[0]}! 👋
              </h1>
              <p className="text-surface-500 font-semibold mt-1">
                You&apos;re doing great! Keep up the momentum.
              </p>
            </div>
            <Link href="/user/chat">
              <Button size="lg" className="px-8 py-4 shadow-glow w-full lg:w-auto">
                🚀 Start Learning
              </Button>
            </Link>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main stats column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Progress Card */}
              <Card padding="lg" className="border-b-4 border-brand-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-black text-surface-900">Weekly Progress</h2>
                  <div className="text-brand-600 font-bold bg-brand-50 px-3 py-1 rounded-full text-xs uppercase tracking-wider">
                    Excellent
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                  <div className="bg-surface-100 rounded-xl p-4 text-center border border-surface-200">
                    <p className="text-2xl mb-1">🔥</p>
                    <p className="text-lg font-black text-surface-900">{user?.streak || 0}</p>
                    <p className="text-[10px] font-bold text-surface-400 uppercase tracking-tighter">Day Streak</p>
                  </div>
                  <div className="bg-surface-100 rounded-xl p-4 text-center border border-surface-200">
                    <p className="text-2xl mb-1">🪙</p>
                    <p className="text-lg font-black text-surface-900">{user?.au || 0}</p>
                    <p className="text-[10px] font-bold text-surface-400 uppercase tracking-tighter">AU Tokens</p>
                  </div>
                  <div className="bg-surface-100 rounded-xl p-4 text-center border border-surface-200">
                    <p className="text-2xl mb-1">🎓</p>
                    <p className="text-lg font-black text-surface-900">{stats?.totalSessions || 0}</p>
                    <p className="text-[10px] font-bold text-surface-400 uppercase tracking-tighter">Lessons</p>
                  </div>
                  <div className="bg-surface-100 rounded-xl p-4 text-center border border-surface-200">
                    <p className="text-2xl mb-1">🌍</p>
                    <p className="text-lg font-black text-surface-900">{user?.topicsExplored?.length || 0}</p>
                    <p className="text-[10px] font-bold text-surface-400 uppercase tracking-tighter">Topics</p>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between p-4 bg-brand-50 rounded-xl border border-brand-100 animate-slide-up">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🛡️</span>
                    <div>
                      <p className="text-xs font-black text-brand-900">Wallet Secure</p>
                      <p className="text-[10px] text-brand-700 font-bold uppercase tracking-wider">Recharge anytime in Profile Settings</p>
                    </div>
                  </div>
                  <Link href="/user/profile" className="text-xs font-black text-brand-600 hover:text-brand-700 underline">
                    View Wallet →
                  </Link>
                </div>
              </Card>

              {/* Recent Sessions */}
              <Card padding="lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-black text-surface-900">Recent Chats</h2>
                  <Link href="/user/chats" className="text-sm font-bold text-brand-600 hover:underline">
                    View all →
                  </Link>
                </div>

                <div className="space-y-3">
                  {recentChats && recentChats.length > 0 ? (
                    recentChats.map((chat) => (
                      <Link
                        key={chat.sessionId}
                        href={`/user/chat?sessionId=${chat.sessionId}`}
                        className="flex items-center justify-between p-4 bg-surface-100 border border-surface-200 rounded-xl hover:border-brand-500 hover:bg-brand-50 transition-all group"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <span className="text-2xl group-hover:scale-110 transition-transform">
                            {chat.topic ? '📚' : '💬'}
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-surface-800 truncate leading-snug">
                              {chat.title || 'Untitled Session'}
                            </p>
                            <p className="text-xs text-surface-400 font-medium">
                              {new Date(chat.updatedAt).toLocaleDateString()} · {chat.sessionMetrics?.messageCount || 0} messages
                            </p>
                          </div>
                        </div>
                        <div className="flex-shrink-0 bg-accent-100 text-accent-700 px-2 py-1 rounded-lg text-xs font-black">
                          +{chat.auEarned || 0} AU
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-4xl mb-3">🦉</p>
                      <p className="text-surface-500 font-semibold mb-4">No learning sessions yet.</p>
                      <Link href="/user/chat">
                        <Button variant="outline" size="sm">Start your first lesson</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Side stats Column */}
            <div className="space-y-6">
              {/* Level Badge Detail */}
              <Card padding="lg" className="bg-gradient-to-br from-brand-50 to-ocean-50 border-brand-100 text-center">
                <div className="flex justify-center mb-4">
                  <AUBadge level={user?.level} xp={user?.au} streak={user?.streak} />
                </div>
                <h3 className="text-lg font-black text-surface-900 mb-1">Level {user?.level} Learner</h3>
                <p className="text-xs text-surface-500 font-bold uppercase tracking-widest mb-4">
                  Points to level {(user?.level || 1) + 1}: {user?.auForNextLevel - user?.au} AU
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <div className="bg-surface-50/80 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-brand-100 text-[10px] font-black tracking-tight uppercase text-brand-700">
                    🏆 TOP 5%
                  </div>
                  <div className="bg-surface-50/80 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-brand-100 text-[10px] font-black tracking-tight uppercase text-ocean-700">
                    🔥 ON FIRE
                  </div>
                </div>
              </Card>

              {/* Topics Explored */}
              <Card padding="lg">
                <h3 className="text-lg font-black text-surface-900 mb-4 flex items-center gap-2">
                  <span>📚</span> Strong Topics
                </h3>
                <div className="flex flex-wrap gap-2 text-center">
                  {(user?.strongAreas?.length || 0) > 0 ? (
                    user.strongAreas.map((topic) => (
                      <span key={topic} className="px-3 py-1.5 bg-surface-50 border border-surface-200 rounded-full text-xs font-bold text-surface-700">
                        {topic}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-surface-400 font-medium italic">Explore more topics to rank up!</p>
                  )}
                </div>

                <hr className="my-6 border-surface-100" />

                <h3 className="text-lg font-black text-surface-900 mb-4 flex items-center gap-2">
                  <span>🎯</span> Need Practice
                </h3>
                <div className="flex flex-wrap gap-2 text-center">
                  {(user?.weakAreas?.length || 0) > 0 ? (
                    user.weakAreas.map((topic) => (
                      <span key={topic} className="px-3 py-1.5 bg-coral-50 border border-coral-200 rounded-full text-xs font-bold text-coral-700">
                        {topic}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-surface-400 font-medium italic">You&apos;re doing great — no weak areas detected! ✨</p>
                  )}
                </div>
              </Card>

              {/* Mindset Card */}
              <Card padding="lg" className="border-b-4 border-purple-200">
                <h3 className="text-lg font-black text-surface-900 mb-2">My Mindset</h3>
                <p className="text-xs text-surface-500 font-bold mb-4 uppercase tracking-tighter">Personalized Profile</p>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-black uppercase text-surface-400">
                      <span>Impatient</span>
                      <span>Patient</span>
                    </div>
                    <ProgressBar value={user?.mindsetProfile?.patience * 100 || 50} max={100} height="sm" color="purple" animated={false} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-black uppercase text-surface-400">
                      <span>Cautious</span>
                      <span>Confident</span>
                    </div>
                    <ProgressBar value={user?.mindsetProfile?.confidence * 100 || 50} max={100} height="sm" color="brand" animated={false} />
                  </div>
                </div>

                <Button variant="ghost" fullWidth className="mt-6 text-xs" onClick={() => (window.location.href = '/user/profile')}>
                  Personalize Profile →
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
