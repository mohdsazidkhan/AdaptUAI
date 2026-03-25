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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="bg-brand-50 dark:bg-brand-900/20 border-brand-100 dark:border-brand-500/20 p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase text-brand-600 dark:text-brand-400 tracking-widest mb-1">Total Users</p>
          <p className="text-3xl font-black text-brand-900 dark:text-brand-100">{stats?.totalUsers}</p>
        </Card>
        <Card className="bg-ocean-50 dark:bg-ocean-900/20 border-ocean-100 dark:border-ocean-500/20 p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase text-ocean-600 dark:text-ocean-400 tracking-widest mb-1">Users Chat</p>
          <p className="text-3xl font-black text-ocean-900 dark:text-ocean-100">{stats?.totalChats}</p>
        </Card>
        <Card className="bg-surface-50 dark:bg-surface-100/50 border-surface-200 dark:border-surface-100/10 p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase text-surface-400 dark:text-surface-500 tracking-widest mb-1">Transactions</p>
          <p className="text-3xl font-black text-surface-900 dark:text-white">{stats?.totalTransactions}</p>
        </Card>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xs font-black uppercase tracking-widest text-surface-500 dark:text-surface-400 mb-1 leading-none">Token Audit</h2>
          <p className="text-[10px] font-bold text-surface-400">System-wide AU token flow</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-500/20 p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase text-purple-600 dark:text-purple-400 tracking-widest mb-1 leading-none">Total AU Tokens</p>
          <div className="flex items-baseline gap-1 mt-2">
            <p className="text-3xl font-black text-purple-900 dark:text-purple-100">{stats?.totalRecharged}</p>
            <p className="text-[10px] font-bold text-purple-500/60 tracking-wider">RECHARGED</p>
          </div>
        </Card>
        <Card className="bg-coral-50 dark:bg-coral-900/20 border-coral-100 dark:border-coral-500/20 p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase text-coral-600 dark:text-coral-400 tracking-widest mb-1 leading-none">Total AU Used</p>
          <div className="flex items-baseline gap-1 mt-2">
            <p className="text-3xl font-black text-coral-900 dark:text-coral-100">{stats?.totalSpent}</p>
            <p className="text-[10px] font-bold text-coral-500/60 tracking-wider">SPENT</p>
          </div>
        </Card>
        <Card className="bg-accent-50 dark:bg-accent-900/20 border-accent-100 dark:border-accent-500/20 p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase text-accent-600 dark:text-accent-400 tracking-widest mb-1 leading-none">Total AU Left</p>
          <div className="flex items-baseline gap-1 mt-2">
            <p className="text-3xl font-black text-accent-900 dark:text-accent-100">{stats?.totalLeft}</p>
            <p className="text-[10px] font-bold text-accent-500/60 tracking-wider">CURRENT</p>
          </div>
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
          <div className="flex items-center gap-3 p-4 bg-brand-50 border border-brand-100 dark:border-brand-500/20 rounded-xl shadow-sm">
            <div className="w-3 h-3 bg-brand-500 rounded-full animate-pulse shadow-[0_0_10px_rgb(34,197,94,0.5)]" />
            <p className="text-sm font-black text-brand-700 dark:text-brand-400">All services operational</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
