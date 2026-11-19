'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, MessagesSquare, ArrowLeftRight, Coins, Flame, Wallet, Download, Megaphone, Mail, ChevronRight } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import { PageHeader, StatCard, card, greyBtn } from '@/components/admin/ui';

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

  const handleExportCSV = async () => {
    try {
      toast.info('Preparing student data export...', { autoClose: 2000 });
      const response = await api.get('/admin/users?all=1');
      const usersList = response.users || [];
      if (usersList.length === 0) {
        toast.warning('No user data to export.');
        return;
      }
      const headers = ['Name', 'Email', 'Role', 'Level', 'AU Balance', 'Joined Date', 'Learning Style', 'Depth', 'Patience (%)', 'Confidence (%)'];
      const csvRows = [
        headers.join(','),
        ...usersList.map((u) => [
          `"${u.name || ''}"`,
          `"${u.email || ''}"`,
          `"${u.role || ''}"`,
          u.level || 1,
          u.au || 0,
          `"${new Date(u.createdAt).toLocaleDateString()}"`,
          `"${u.mindsetProfile?.learningStyle || 'N/A'}"`,
          `"${u.mindsetProfile?.depthPreference || 'N/A'}"`,
          Math.round((u.mindsetProfile?.patience || 0) * 100),
          Math.round((u.mindsetProfile?.confidence || 0) * 100),
        ].join(',')),
      ];
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.hidden = true;
      a.href = url;
      a.download = `adaptuai_students_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('Export downloaded successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export user data.');
    }
  };

  const handleSystemBroadcast = () => {
    toast.info('System broadcast is coming in a later version.');
  };

  const v = (n) => (loading ? '…' : n ?? 0);

  return (
    <div className="space-y-3 lg:space-y-4">
      <PageHeader title="Admin Dashboard" />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
        <StatCard icon={Users} label="Total users" value={v(stats?.totalUsers)} />
        <StatCard icon={MessagesSquare} label="Users chat sessions" value={v(stats?.totalChats)} />
        <StatCard icon={ArrowLeftRight} label="Transactions" value={v(stats?.totalTransactions)} tone="grey" />
      </div>

      <section className={`${card} p-3 sm:p-4`}>
        <h2 className="text-lg font-bold text-surface-900">Token <span className="text-brand-500">audit</span></h2>
        <p className="mb-3 text-sm text-surface-500">System-wide AU token flow</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { icon: Coins, label: 'Total AU issued', value: v(stats?.totalRecharged), tone: 'bg-brand-500/15 text-brand-600' },
            { icon: Flame, label: 'Total AU used', value: v(stats?.totalSpent), tone: 'bg-coral-500/15 text-coral-600' },
            { icon: Wallet, label: 'AU left with users', value: v(stats?.totalLeft), tone: 'bg-accent-500/15 text-accent-600' },
          ].map(({ icon: Icon, label, value, tone }) => (
            <div key={label} className="flex items-center gap-3 rounded-lg bg-surface-100 p-3">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone}`}><Icon className="h-5 w-5" /></span>
              <div>
                <p className="text-sm text-surface-500">{label}</p>
                <p className="text-lg font-bold text-surface-900">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-2 lg:gap-4">
        <section className={`${card} p-3 sm:p-4`}>
          <h2 className="mb-3 text-lg font-bold text-surface-900">Quick <span className="text-brand-500">actions</span></h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={handleExportCSV} className={`${greyBtn} h-11 justify-start`}><Download className="h-4 w-4" /> Export user data (CSV)</button>
            <button type="button" onClick={handleSystemBroadcast} className={`${greyBtn} h-11 justify-start`}><Megaphone className="h-4 w-4" /> System broadcast</button>
            <Link href="/admin/contacts" className={`${greyBtn} h-11 justify-start sm:col-span-2`}>
              <Mail className="h-4 w-4" /> Contact messages <ChevronRight className="ml-auto h-4 w-4 text-surface-500" />
            </Link>
          </div>
        </section>

        <section className={`${card} p-3 sm:p-4`}>
          <h2 className="mb-3 text-lg font-bold text-surface-900">System <span className="text-brand-500">health</span></h2>
          <div className="flex items-center gap-3 rounded-lg bg-brand-500/15 p-3">
            <span className="h-3 w-3 animate-pulse rounded-full bg-brand-500" />
            <p className="text-sm font-semibold text-brand-600">All services operational</p>
          </div>
          <p className="mt-2 text-sm text-surface-500">Token use and streak tracking are active.</p>
        </section>
      </div>
    </div>
  );
}
