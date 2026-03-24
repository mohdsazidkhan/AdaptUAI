'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/Card';
import { PageLoader } from '@/components/Loader';
import api from '@/lib/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await api.get('/admin/stats');
        setStats(response.stats);
      } catch (err) {
        console.error('Failed to fetch admin stats:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-surface-900 dark:text-white">Admin Overview</h1>
        <p className="text-surface-500 font-bold mt-2">System-wide metrics and status</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <Card className="bg-brand-50 dark:bg-brand-900/20 border-brand-100 dark:border-brand-500/20 p-6">
          <p className="text-[10px] font-black uppercase text-brand-600 dark:text-brand-400 tracking-widest mb-1">Total Users</p>
          <p className="text-3xl font-black text-brand-900 dark:text-brand-100">{stats?.totalUsers}</p>
        </Card>
        <Card className="bg-ocean-50 dark:bg-ocean-900/20 border-ocean-100 dark:border-ocean-500/20 p-6">
          <p className="text-[10px] font-black uppercase text-ocean-600 dark:text-ocean-400 tracking-widest mb-1">System Chats</p>
          <p className="text-3xl font-black text-ocean-900 dark:text-ocean-100">{stats?.totalChats}</p>
        </Card>
        <Card className="bg-coral-50 dark:bg-coral-900/20 border-coral-100 dark:border-coral-500/20 p-6">
          <p className="text-[10px] font-black uppercase text-coral-600 dark:text-coral-400 tracking-widest mb-1">Transactions</p>
          <p className="text-3xl font-black text-coral-900 dark:text-coral-100">{stats?.totalTransactions}</p>
        </Card>
        <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-500/20 p-6">
          <p className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 tracking-widest mb-1">Total AU Tokens</p>
          <p className="text-3xl font-black text-purple-900 dark:text-purple-100">{stats?.totalAU}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card title="Quick Actions" padding="lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button className="p-4 bg-surface-100 hover:bg-surface-200 rounded-xl font-bold text-sm transition-all border border-surface-200">
              Export User Data
            </button>
            <button className="p-4 bg-surface-100 hover:bg-surface-200 rounded-xl font-bold text-sm transition-all border border-surface-200">
              System Broadcast
            </button>
          </div>
        </Card>
        
        <Card title="System Health" padding="lg">
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-xl">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <p className="text-sm font-bold text-green-700 dark:text-green-400">All services operational</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
