'use client';

import { useEffect, useState } from 'react';
import { Mail, MailOpen, Reply, Trash2, Inbox, X, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/lib/api';
import { PageHeader, SearchField, Pill, IconButton, brandBtn, greyBtn, fmtDateTime } from '@/components/admin/ui';
import DataView, { SelectField, ViewToggle, Pagination } from '@/components/admin/DataView';
import { useAdminList, useViewMode } from '@/components/admin/useAdminList';

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'unread', label: 'Unread first' },
  { value: 'name', label: 'Name A–Z' },
];
const STATUSES = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
];
const RANGES = [
  { value: 'all', label: 'Any time' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
];

const replyHref = (c) =>
  `mailto:${c.email}?subject=${encodeURIComponent(`Re: ${c.subject}`)}&body=${encodeURIComponent(`Hi ${c.name},\n\n\n\n---\nYour message:\n${c.message}`)}`;

export default function AdminContacts() {
  const list = useAdminList('/admin/contacts', { sort: 'newest', status: 'all', range: 'all' });
  const [view, setView] = useViewMode('admin-contacts');
  const [open, setOpen] = useState(null);
  const contacts = list.data?.contacts || [];
  const total = list.data?.pagination?.total ?? 0;
  const unread = list.data?.unread ?? 0;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const setRead = async (c, isRead) => {
    if (c.isRead === isRead) return;
    list.setData((d) => ({
      ...d,
      unread: Math.max((d.unread || 0) + (isRead ? -1 : 1), 0),
      contacts: d.contacts.map((x) => (x._id === c._id ? { ...x, isRead } : x)),
    }));
    setOpen((o) => (o && o._id === c._id ? { ...o, isRead } : o));
    try {
      await api.patch('/admin/contacts', { id: c._id, isRead });
    } catch {
      toast.error('Could not update message');
      list.reload();
    }
  };

  const openMessage = (c) => {
    setOpen(c);
    setRead(c, true);
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete the message from ${c.name}?`)) return;
    try {
      await api.delete('/admin/contacts', { data: { id: c._id } });
      toast.success('Message deleted');
      setOpen(null);
      if (contacts.length === 1 && list.params.page > 1) list.set({ page: list.params.page - 1 });
      else list.reload();
    } catch {
      toast.error('Could not delete message');
    }
  };

  const actions = (c, tip = 'top') => (
    <div className="flex justify-end gap-1.5">
      <IconButton icon={Reply} label="Reply by email" tip={tip} onClick={() => { setRead(c, true); window.location.href = replyHref(c); }} />
      <IconButton icon={c.isRead ? Mail : MailOpen} label={c.isRead ? 'Mark as unread' : 'Mark as read'} tip={tip} onClick={() => setRead(c, !c.isRead)} />
      <IconButton icon={Trash2} label="Delete" tip={tip} danger onClick={() => remove(c)} />
    </div>
  );

  const columns = [
    {
      key: 'sender', header: 'From', primary: true,
      render: (c) => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500 font-bold text-white">
            {(c.name?.[0] || '?').toUpperCase()}
            {!c.isRead && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-surface-50 bg-coral-500" aria-label="Unread" />}
          </span>
          <div className="min-w-0">
            <p className={`truncate text-surface-900 ${c.isRead ? 'font-medium' : 'font-bold'}`}>{c.name}</p>
            <p className="truncate text-xs text-surface-500">{c.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'subject', header: 'Subject', className: 'max-w-[220px]', render: (c) => <span className={`block truncate ${c.isRead ? '' : 'font-semibold'}`}>{c.subject}</span> },
    { key: 'message', header: 'Message', className: 'max-w-[320px]', render: (c) => <span className="line-clamp-2 text-surface-500">{c.message}</span> },
    { key: 'status', header: 'Status', render: (c) => (c.isRead ? <Pill>Read</Pill> : <Pill tone="coral">Unread</Pill>) },
    { key: 'date', header: 'Received', className: 'whitespace-nowrap text-surface-500', render: (c) => fmtDateTime(c.createdAt) },
    { key: 'actions', header: 'Actions', actions: true, align: 'right', render: (c) => actions(c) },
  ];

  return (
    <div className="table-page">
      <PageHeader
        title="Contacts"
        count={total}
        search={<SearchField value={list.searchInput} onChange={list.setSearchInput} placeholder="Search name, email, subject or message" label="Search messages" />}
        filters={<>
        <SelectField label="Status" value={list.params.status} onChange={(v) => list.set({ status: v })} options={STATUSES.map((s) => (s.value === 'unread' && unread ? { ...s, label: `Unread (${unread})` } : s))} />
        <SelectField label="Received" value={list.params.range} onChange={(v) => list.set({ range: v })} options={RANGES} />
          <SelectField label="Sort" value={list.params.sort} onChange={(v) => list.set({ sort: v })} options={SORTS} /><ViewToggle view={view} onChange={setView} />
        </>}
        actions={<IconButton icon={RefreshCw} label="Refresh" onClick={list.reload} />}
      />


      <section className="fb-card table-scroll">
        <DataView
          view={view}
          columns={columns}
          rows={contacts}
          rowKey={(c) => c._id}
          loading={list.loading}
          onRowClick={openMessage}
          rowClassName={(c) => (c.isRead ? '' : 'bg-brand-500/5')}
          empty={{ icon: Inbox, title: list.params.search ? 'No messages match your search' : 'No messages found', text: 'Messages from the contact form appear here.' }}
        />
      </section>

      <Pagination pagination={list.data?.pagination} onPage={(p) => list.set({ page: p })} onLimit={(l) => list.set({ limit: l })} />

      {/* Full message */}
      {open && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={`Message from ${open.name}`}>
          <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={() => setOpen(null)} />
          <div className="relative max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-t-xl bg-surface-50 shadow-menu animate-slide-up sm:rounded-lg">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-surface-200 bg-surface-50 px-4 py-3">
              <h2 className="truncate text-lg font-bold text-surface-900">{open.subject}</h2>
              <IconButton icon={X} label="Close" onClick={() => setOpen(null)} />
            </div>
            <div className="space-y-3 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500 font-bold text-white">{(open.name?.[0] || '?').toUpperCase()}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-surface-900">{open.name}</p>
                  <p className="truncate text-sm text-surface-500">{open.email} · {fmtDateTime(open.createdAt)}</p>
                </div>
                {open.userId && <Pill className="ml-auto">Registered user</Pill>}
              </div>
              <p className="whitespace-pre-wrap break-words rounded-lg bg-surface-100 p-3 text-[15px] leading-relaxed text-surface-900">{open.message}</p>
              <div className="flex flex-wrap justify-end gap-2 border-t border-surface-200 pt-3">
                <button type="button" onClick={() => remove(open)} className={`${greyBtn} hover:text-coral-600`}><Trash2 className="h-4 w-4" /> Delete</button>
                <button type="button" onClick={() => setRead(open, !open.isRead)} className={greyBtn}>
                  {open.isRead ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />} {open.isRead ? 'Mark unread' : 'Mark read'}
                </button>
                <a href={replyHref(open)} className={brandBtn}><Reply className="h-4 w-4" /> Reply</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
