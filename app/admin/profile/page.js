'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { PageLoader } from '@/components/Loader';
import api from '@/lib/api';
import { toast } from 'react-toastify';

export default function AdminProfilePage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await api.get('/admin/profile');
        if (response.user.role !== 'admin') {
          router.push('/user/profile');
          return;
        }
        setData(response.user);
      } catch (err) {
        console.error('Failed to fetch admin profile:', err);
        toast.error('⚠️ Could not load profile data.');
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [router]);

  const handleUpdate = async (fields) => {
    setSaving(true);
    try {
      const response = await api.patch('/admin/profile', fields);
      setData(prev => ({ ...prev, ...response.user }));
      toast.success('Admin profile updated! ✨');
    } catch (err) {
      console.error('Failed to update profile:', err);
      toast.error('⚠️ Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <PageLoader />;

  return (
    <div className="p-4 sm:p-4 lg:-8 container mx-auto">
      <header className="mb-8 pl-1">
        <h1 className="text-xl lg:text-3xl font-black text-surface-900 dark:text-white flex items-center gap-3">
          <span className="p-2 bg-brand-500 text-white rounded-xl text-xl shadow-lg shadow-brand-500/20">👤</span>
          Admin Identity
        </h1>
        <p className="text-surface-500 font-bold mt-2 ml-1">System-level account management and metadata</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card padding="lg" className="text-center bg-brand-50/5 dark:bg-brand-900/5 border-brand-100/30 overflow-hidden relative">
            <div className="relative inline-block mb-6 mt-4">
              <img
                src={data?.avatarUrl || `https://api.dicebear.com/8.x/fun-emoji/svg?seed=${encodeURIComponent(data?.name || 'admin')}`}
                alt={data?.name}
                className="w-16 lg:w-32 h-16 lg:h-32 rounded-xl lg:rounded-3xl bg-surface-100 border-4 border-surface-200 dark:border-surface-800 shadow-2xl mx-auto object-cover transition-transform hover:scale-105"
              />
              <div className="absolute -bottom-2 -right-2 bg-brand-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-black border-2 border-surface-50 dark:border-surface-900 shadow-lg uppercase tracking-tight antialiased">
                🛡️ Root Admin
              </div>
            </div>

            <h2 className="text-2xl font-black text-surface-900 dark:text-white mt-4 leading-tight">{data?.name}</h2>
            <p className="text-sm text-surface-500 font-bold mb-6">{data?.email}</p>

            <div className="flex flex-col gap-2 w-full pt-4 border-t border-surface-100 dark:border-surface-100/10">
              <div className="flex justify-between items-center px-4 py-2 bg-surface-50 rounded-xl border border-surface-100 dark:border-surface-100/10 shadow-sm">
                <span className="text-[10px] font-black uppercase text-surface-400 tracking-widest">AU Balance</span>
                <span className="text-xs font-black text-brand-600">{data?.au} AU</span>
              </div>
              <div className="flex justify-between items-center px-4 py-2 bg-surface-50 rounded-xl border border-surface-100 dark:border-surface-100/10 shadow-sm">
                <span className="text-[10px] font-black uppercase text-surface-400 tracking-widest">Current Streak</span>
                <span className="text-xs font-black text-coral-600">{data?.streak} Days</span>
              </div>
            </div>
          </Card>

          <Card title="System Metadata" padding="lg">
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black uppercase text-surface-400 tracking-widest mb-1.5 ml-1">Account Unique ID</p>
                <p className="text-[11px] font-mono font-bold text-surface-600 bg-surface-100 p-2.5 rounded-xl truncate border border-surface-200 dark:border-surface-100/10">
                  {data?.id}
                </p>
              </div>
              <div className="pt-2 border-t border-surface-100 dark:border-surface-100/5">
                <p className="text-[10px] font-black uppercase text-surface-400 tracking-widest mb-1 ml-1">Created On</p>
                <p className="text-xs font-bold text-surface-700 dark:text-surface-300 ml-1">
                  {formatDate(data?.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-surface-400 tracking-widest mb-1 ml-1">Last Active</p>
                <p className="text-xs font-bold text-surface-700 dark:text-surface-300 ml-1">
                  {formatDate(data?.lastActiveDate)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Settings Column */}
        <div className="lg:col-span-2 space-y-8">
          <Card padding="lg" title="Profile Configuration" className="relative h-full">
            {saving && (
              <div className="absolute top-6 right-8 flex items-center gap-2 px-3 py-1 bg-brand-50 dark:bg-brand-900/20 rounded-full border border-brand-100 dark:border-brand-500/20">
                <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest">Saving Changes</span>
              </div>
            )}

            <div className="space-y-8 mt-4">
              <div>
                <label className="block text-[10px] font-black text-surface-400 uppercase tracking-widest mb-2.5 px-1 ml-1">Full Name</label>
                <input
                  type="text"
                  defaultValue={data?.name}
                  onBlur={(e) => {
                    if (e.target.value && e.target.value !== data?.name) handleUpdate({ name: e.target.value });
                  }}
                  className="w-full px-5 py-3.5 bg-surface-100 border-2 border-surface-200 dark:border-surface-100/10 rounded-2xl focus:border-brand-500 focus:outline-none transition-all font-black text-surface-800 dark:text-surface-900 text-sm shadow-sm"
                  placeholder="Enter admin name"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-surface-400 uppercase tracking-widest mb-2.5 px-1 ml-1">Account Email</label>
                <input
                  type="email"
                  value={data?.email}
                  disabled
                  className="w-full px-5 py-3.5 bg-surface-200/50 border-2 border-surface-200 dark:border-surface-100/10 rounded-2xl font-bold text-surface-400 dark:text-surface-500 text-sm cursor-not-allowed"
                />
                <p className="mt-2 text-[10px] text-surface-400 font-bold italic ml-2">Email changes must be requested through system support </p>
              </div>

              <div className="p-6 bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-500/20 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-brand-100 dark:bg-brand-800 rounded-xl text-xl">🛡️</div>
                  <h4 className="text-sm font-black text-brand-900 dark:text-brand-400 uppercase tracking-widest leading-none">Administrative Credentials</h4>
                </div>
                <p className="text-xs text-brand-700 dark:text-brand-300 font-bold leading-relaxed opacity-90">
                  Your identity is part of the core management team. Profile updates here are reflected across the system-wide activity logs. Ensure your name matches your organizational records.
                </p>
              </div>

              <div className="pt-8 border-t border-surface-100 dark:border-surface-100/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => router.push('/admin/dashboard')}
                  className="text-[10px] font-black uppercase tracking-widest py-4 border-2 hover:bg-surface-100"
                >
                  ← System Dashboard
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => router.push('/admin/users')}
                  className="text-[10px] font-black uppercase tracking-widest py-4 shadow-xl shadow-brand-500/10"
                >
                  Manage System Users →
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
