'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, LayoutDashboard, Users, Check } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'react-toastify';
import { avatarFor } from '@/lib/navItems';
import { PageHeader, Pill, ListSkeleton, card, greyBtn, brandBtn, fmtDateTime } from '@/components/admin/ui';

const field =
  'h-11 w-full rounded-lg border border-transparent bg-surface-100 px-4 text-[15px] text-surface-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:text-surface-500';

export default function AdminProfilePage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await api.get('/admin/profile');
        if (response.user.role !== 'admin') {
          router.push('/user/profile');
          return;
        }
        setData(response.user);
        setName(response.user.name || '');
      } catch (err) {
        console.error('Failed to fetch admin profile:', err);
        toast.error('Could not load profile data.');
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [router]);

  const saveName = async (e) => {
    e?.preventDefault();
    const next = name.trim();
    if (!next || next === data?.name) return;
    setSaving(true);
    try {
      const response = await api.patch('/admin/profile', { name: next });
      setData((prev) => ({ ...prev, ...response.user }));
      toast.success('Profile updated');
    } catch (err) {
      console.error('Failed to update profile:', err);
      toast.error('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 lg:space-y-4">
        <PageHeader title="Admin Profile" />
        <section className={card}><ListSkeleton rows={3} /></section>
      </div>
    );
  }

  return (
    <div className="space-y-3 lg:space-y-4">
      <PageHeader title="Admin Profile" />

      <div className="grid gap-3 lg:grid-cols-3 lg:gap-4">
        <div className="space-y-3 lg:space-y-4">
          <section className={`${card} flex flex-col items-center p-4 text-center`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarFor(data)} alt="" className="h-24 w-24 rounded-full bg-surface-100 object-cover" />
            <h2 className="mt-3 text-xl font-bold text-surface-900">{data?.name}</h2>
            <p className="text-sm text-surface-500">{data?.email}</p>
            <Pill tone="brand" className="mt-2"><ShieldCheck className="h-3.5 w-3.5" /> Root admin</Pill>
          </section>

          <section className={`${card} space-y-3 p-4`}>
            <h3 className="font-semibold text-surface-900">System metadata</h3>
            <div>
              <p className="text-xs text-surface-500">Account ID</p>
              <p className="truncate rounded-lg bg-surface-100 px-3 py-2 font-mono text-xs text-surface-900">{data?.id || data?._id || '–'}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-surface-500">Created</p>
                <p className="text-sm font-medium text-surface-900">{fmtDateTime(data?.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs text-surface-500">Last active</p>
                <p className="text-sm font-medium text-surface-900">{fmtDateTime(data?.lastActiveDate)}</p>
              </div>
            </div>
          </section>
        </div>

        <section className={`${card} p-4 lg:col-span-2`}>
          <h3 className="text-lg font-bold text-surface-900">Profile <span className="text-brand-500">settings</span></h3>
          <form onSubmit={saveName} className="mt-3 space-y-3">
            <div>
              <label htmlFor="admin-name" className="mb-1 block text-sm font-semibold text-surface-900">Full name</label>
              <div className="flex gap-2">
                <input id="admin-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className={field} placeholder="Admin name" />
                <button type="submit" disabled={saving || !name.trim() || name.trim() === data?.name} className={`${brandBtn} h-11 shrink-0`}>
                  <Check className="h-4 w-4" /> {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="admin-email" className="mb-1 block text-sm font-semibold text-surface-900">Account email</label>
              <input id="admin-email" type="email" value={data?.email || ''} disabled className={field} />
              <p className="mt-1 text-xs text-surface-500">Email changes must be requested through system support.</p>
            </div>
          </form>

          <div className="mt-4 flex gap-3 rounded-lg bg-brand-500/15 p-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
            <p className="text-sm text-surface-900">
              This account manages the whole system. Name changes show up in admin activity, so keep it matching your records.
            </p>
          </div>

          <div className="mt-4 grid gap-2 border-t border-surface-200 pt-4 sm:grid-cols-2">
            <Link href="/admin/dashboard" className={`${greyBtn} h-11`}><LayoutDashboard className="h-4 w-4" /> Dashboard</Link>
            <Link href="/admin/users" className={`${brandBtn} h-11`}><Users className="h-4 w-4" /> Manage users</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
