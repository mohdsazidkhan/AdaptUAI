'use client';

import { useEffect, useState } from 'react';
import { Users, Eye, Trash2, X, RefreshCw, Coins } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/lib/api';
import { avatarFor } from '@/lib/navItems';
import { PageHeader, SearchField, Pill, IconButton, fmtDate, fmtDateTime } from '@/components/admin/ui';
import DataView, { SelectField, ViewToggle, Pagination } from '@/components/admin/DataView';
import { useAdminList, useViewMode } from '@/components/admin/useAdminList';
import RechargeModal from '@/components/admin/RechargeModal';

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'au_high', label: 'AU high–low' },
  { value: 'au_low', label: 'AU low–high' },
  { value: 'level', label: 'Level' },
  { value: 'active', label: 'Last active' },
];
const STYLES = [
  { value: 'all', label: 'All' },
  { value: 'visual', label: 'Visual' },
  { value: 'analytical', label: 'Analytical' },
  { value: 'practical', label: 'Practical' },
  { value: 'narrative', label: 'Narrative' },
];
const BALANCES = [
  { value: 'all', label: 'All' },
  { value: 'zero', label: 'Empty (0 AU)' },
  { value: 'low', label: 'Low (<20 AU)' },
  { value: 'has', label: '20+ AU' },
];
const RANGES = [
  { value: 'all', label: 'Any time' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
];


export default function AdminUsers() {
  const list = useAdminList('/admin/users', { sort: 'newest', style: 'all', balance: 'all', range: 'all' });
  const [view, setView] = useViewMode('admin-users');
  const [selectedUser, setSelectedUser] = useState(null);
  const [rechargeUser, setRechargeUser] = useState(null);
  const users = list.data?.users || [];
  const total = list.data?.pagination?.total ?? 0;

  useEffect(() => {
    if (!selectedUser || rechargeUser) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setSelectedUser(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selectedUser, rechargeUser]);


  const afterRecharge = (newBalance) => {
    const id = rechargeUser._id;
    list.setData((d) => ({ ...d, users: d.users.map((u) => (u._id === id ? { ...u, au: newBalance } : u)) }));
    setSelectedUser((s) => (s && s._id === id ? { ...s, au: newBalance } : s));
    setRechargeUser(null);
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Delete ${user.name}? This cannot be undone.`)) return;
    try {
      await api.delete('/admin/users', { data: { userId: user._id } });
      if (selectedUser?._id === user._id) setSelectedUser(null);
      toast.success('User deleted');
      list.reload();
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const columns = [
    {
      key: 'user', header: 'User', primary: true,
      render: (u) => (
        <div className="flex min-w-0 items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatarFor(u)} alt="" className="h-10 w-10 shrink-0 rounded-full bg-surface-100 object-cover" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-surface-900">{u.name}</p>
            <p className="truncate text-xs text-surface-500">{u.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'level', header: 'Level', render: (u) => <Pill tone="brand">Level {u.level || 1}</Pill> },
    { key: 'au', header: 'AU balance', align: 'center', render: (u) => <span className="font-semibold text-surface-900">{u.au ?? 0} AU</span> },
    { key: 'style', header: 'Learning style', render: (u) => <span className="capitalize">{u.mindsetProfile?.learningStyle || '–'}</span> },
    { key: 'joined', header: 'Joined', className: 'whitespace-nowrap text-surface-500', render: (u) => fmtDate(u.createdAt) },
    { key: 'active', header: 'Last active', className: 'whitespace-nowrap text-surface-500', render: (u) => fmtDateTime(u.lastActiveDate) },
    {
      key: 'actions', header: 'Actions', actions: true, align: 'right',
      render: (u) => (
        <div className="flex justify-end gap-1.5">
          <IconButton icon={Coins} label="Recharge AU" tip="top" onClick={() => setRechargeUser(u)} />
          <IconButton icon={Eye} label="View profile" tip="top" onClick={() => setSelectedUser(u)} />
          <IconButton icon={Trash2} label="Delete user" tip="top" danger onClick={() => handleDeleteUser(u)} />
        </div>
      ),
    },
  ];

  return (
    <div className="table-page">
      <PageHeader
        title="Users"
        count={total}
        search={<SearchField value={list.searchInput} onChange={list.setSearchInput} placeholder="Search by name or email" label="Search users" />}
        filters={<>
        <SelectField label="Style" value={list.params.style} onChange={(v) => list.set({ style: v })} options={STYLES} />
        <SelectField label="Balance" value={list.params.balance} onChange={(v) => list.set({ balance: v })} options={BALANCES} />
        <SelectField label="Joined" value={list.params.range} onChange={(v) => list.set({ range: v })} options={RANGES} />
          <SelectField label="Sort" value={list.params.sort} onChange={(v) => list.set({ sort: v })} options={SORTS} /><ViewToggle view={view} onChange={setView} />
        </>}
        actions={<IconButton icon={RefreshCw} label="Refresh" onClick={list.reload} />}
      />


      <section className="fb-card table-scroll">
        <DataView
          view={view}
          columns={columns}
          rows={users}
          rowKey={(u) => u._id}
          loading={list.loading}
          onRowClick={setSelectedUser}
          empty={{ icon: Users, title: list.params.search ? 'No users match your search' : 'No users found', text: 'Try changing the filters.' }}
        />
      </section>

      <Pagination pagination={list.data?.pagination} onPage={(p) => list.set({ page: p })} onLimit={(l) => list.set({ limit: l })} />

      {/* Learner detail panel */}
      {selectedUser && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={`${selectedUser.name} profile`}>
          <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={() => setSelectedUser(null)} />
          <div className="relative max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-t-xl bg-surface-50 shadow-menu animate-slide-up sm:rounded-lg">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-surface-200 bg-surface-50 px-4 py-3">
              <h2 className="text-lg font-bold text-surface-900">Learner <span className="text-brand-500">profile</span></h2>
              <IconButton icon={X} label="Close" onClick={() => setSelectedUser(null)} />
            </div>
            <div className="space-y-4 p-4">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarFor(selectedUser)} alt="" className="h-16 w-16 rounded-full bg-surface-100 object-cover" />
                <div className="min-w-0">
                  <p className="text-lg font-bold text-surface-900">{selectedUser.name}</p>
                  <p className="truncate text-sm text-surface-500">{selectedUser.email}</p>
                  <p className="text-xs text-surface-500">Member since {fmtDate(selectedUser.createdAt)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ['Level', selectedUser.level || 1],
                  ['AU balance', `${selectedUser.au ?? 0} AU`],
                  ['Streak', `${selectedUser.streak || 0} days`],
                  ['Topics', selectedUser.topicsExplored?.length || 0],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-surface-100 p-3">
                    <p className="text-xs text-surface-500">{label}</p>
                    <p className="font-bold text-surface-900">{value}</p>
                  </div>
                ))}
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-surface-900">Mindset profile</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ['Learning style', selectedUser.mindsetProfile?.learningStyle || 'N/A'],
                    ['Depth preference', selectedUser.mindsetProfile?.depthPreference || 'N/A'],
                    ['Patience', `${Math.round((selectedUser.mindsetProfile?.patience || 0) * 100)}%`],
                    ['Confidence', `${Math.round((selectedUser.mindsetProfile?.confidence || 0) * 100)}%`],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-surface-200 p-3">
                      <p className="text-xs text-surface-500">{label}</p>
                      <p className="font-semibold capitalize text-surface-900">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-surface-900">Topics explored</h3>
                {selectedUser.topicsExplored?.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">{selectedUser.topicsExplored.map((t) => <Pill key={t}>{t}</Pill>)}</div>
                ) : (
                  <p className="text-sm text-surface-500">No topics yet.</p>
                )}
              </div>
              {selectedUser.weakAreas?.length > 0 && (
                <div>
                  <h3 className="mb-2 font-semibold text-surface-900">Needs practice</h3>
                  <div className="flex flex-wrap gap-1.5">{selectedUser.weakAreas.map((t) => <Pill key={t} tone="coral">{t}</Pill>)}</div>
                </div>
              )}
              <div className="flex flex-wrap justify-end gap-2 border-t border-surface-200 pt-3">
                <button type="button" onClick={() => setRechargeUser(selectedUser)} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-500 px-3 text-sm font-semibold text-white transition hover:brightness-110">
                  <Coins className="h-4 w-4" /> Recharge AU
                </button>
                <button type="button" onClick={() => handleDeleteUser(selectedUser)} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-coral-500/15 px-3 text-sm font-semibold text-coral-600 transition hover:bg-coral-500/25">
                  <Trash2 className="h-4 w-4" /> Delete user
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {rechargeUser && <RechargeModal user={rechargeUser} onClose={() => setRechargeUser(null)} onDone={afterRecharge} />}
    </div>
  );
}
