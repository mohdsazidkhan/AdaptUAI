'use client';

import { useRouter } from 'next/navigation';
import { MessagesSquare, Eye, RefreshCw } from 'lucide-react';
import { avatarFor } from '@/lib/navItems';
import { PageHeader, SearchField, Pill, IconButton, fmtDateTime } from '@/components/admin/ui';
import DataView, { SelectField, ViewToggle, Pagination } from '@/components/admin/DataView';
import { useAdminList, useViewMode } from '@/components/admin/useAdminList';

const SORTS = [
  { value: 'recent', label: 'Recent activity' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'messages', label: 'Most messages' },
  { value: 'au', label: 'Most AU used' },
  { value: 'title', label: 'Title A–Z' },
];
const RANGES = [
  { value: 'all', label: 'Any time' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
];
const AU = [
  { value: 'all', label: 'All' },
  { value: 'used', label: 'AU used' },
  { value: 'none', label: 'No AU used' },
];

export default function AdminChats() {
  const router = useRouter();
  const list = useAdminList('/admin/chats', { sort: 'recent', range: 'all', au: 'all' });
  const [view, setView] = useViewMode('admin-chats');
  const chats = list.data?.chats || [];
  const total = list.data?.pagination?.total ?? 0;
  const open = (c) => router.push(`/admin/chats/${c.sessionId}`);

  const columns = [
    {
      key: 'chat', header: 'Chat', primary: true,
      render: (c) => (
        <div className="flex min-w-0 items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatarFor(c.userId)} alt="" className="h-10 w-10 shrink-0 rounded-full bg-surface-100 object-cover" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-surface-900">{c.title || 'Untitled chat'}</p>
            <p className="truncate text-xs text-surface-500">{c.userId?.name || 'Unknown user'}{c.userId?.email ? ` · ${c.userId.email}` : ''}</p>
          </div>
        </div>
      ),
    },
    { key: 'topic', header: 'Topic', render: (c) => (c.topic ? <Pill tone="brand">{c.topic}</Pill> : <span className="text-surface-500">–</span>) },
    { key: 'messages', header: 'Messages', align: 'center', render: (c) => <Pill>{c.messageCount ?? 0}</Pill> },
    { key: 'au', header: 'AU used', align: 'center', render: (c) => (c.auEarned > 0 ? <Pill tone="accent">{c.auEarned} AU</Pill> : <span className="text-surface-500">0</span>) },
    { key: 'updated', header: 'Last activity', className: 'whitespace-nowrap text-surface-500', render: (c) => fmtDateTime(c.updatedAt) },
    {
      key: 'actions', header: 'Actions', actions: true, align: 'right',
      render: (c) => <div className="flex justify-end"><IconButton icon={Eye} label="View transcript" tip="top" href={`/admin/chats/${c.sessionId}`} /></div>,
    },
  ];

  return (
    <div className="table-page">
      <PageHeader
        title="Users Chat"
        count={total}
        search={<SearchField value={list.searchInput} onChange={list.setSearchInput} placeholder="Search title, topic, name or email" label="Search chats" />}
        filters={<>
        <SelectField label="Active" value={list.params.range} onChange={(v) => list.set({ range: v })} options={RANGES} />
        <SelectField label="AU" value={list.params.au} onChange={(v) => list.set({ au: v })} options={AU} />
          <SelectField label="Sort" value={list.params.sort} onChange={(v) => list.set({ sort: v })} options={SORTS} /><ViewToggle view={view} onChange={setView} />
        </>}
        actions={<IconButton icon={RefreshCw} label="Refresh" onClick={list.reload} />}
      />


      <section className="fb-card table-scroll">
        <DataView
          view={view}
          columns={columns}
          rows={chats}
          rowKey={(c) => c._id}
          loading={list.loading}
          onRowClick={open}
          empty={{ icon: MessagesSquare, title: list.params.search ? 'No chats match your search' : 'No chats found', text: 'Try changing the filters.' }}
        />
      </section>

      <Pagination pagination={list.data?.pagination} onPage={(p) => list.set({ page: p })} onLimit={(l) => list.set({ limit: l })} />
    </div>
  );
}
