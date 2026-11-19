'use client';

import { useCallback, useEffect, useState } from 'react';
import { Search, Mail, MailOpen, Reply, Trash2, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/lib/api';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'read', label: 'Read' },
];
const LIMIT = 20;

const roundBtn =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-100 text-surface-900 transition-colors hover:bg-surface-200';

function formatWhen(d) {
  const date = new Date(d);
  return `${date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} · ${date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}`;
}

export default function AdminContacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [unread, setUnread] = useState(0);
  const [openId, setOpenId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT), status, ...(search && { search }) });
      const data = await api.get(`/admin/contacts?${params}`);
      setContacts(data.contacts || []);
      setPagination(data.pagination || { total: 0, totalPages: 1 });
      setUnread(data.unread || 0);
    } catch (err) {
      toast.error(err.message || 'Could not load messages');
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => { load(); }, [load]);

  // Search waits a moment after typing stops.
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const setRead = async (c, isRead) => {
    setContacts((list) => list.map((x) => (x._id === c._id ? { ...x, isRead } : x)));
    setUnread((n) => Math.max(n + (isRead ? -1 : 1), 0));
    try {
      await api.patch('/admin/contacts', { id: c._id, isRead });
    } catch {
      toast.error('Could not update message');
      load();
    }
  };

  const toggleOpen = (c) => {
    setOpenId((id) => (id === c._id ? null : c._id));
    if (!c.isRead) setRead(c, true);
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete the message from ${c.name}?`)) return;
    try {
      await api.delete('/admin/contacts', { data: { id: c._id } });
      toast.success('Message deleted');
      if (contacts.length === 1 && page > 1) setPage((p) => p - 1);
      else load();
    } catch {
      toast.error('Could not delete message');
    }
  };

  const replyHref = (c) =>
    `mailto:${c.email}?subject=${encodeURIComponent(`Re: ${c.subject}`)}&body=${encodeURIComponent(`Hi ${c.name},\n\n\n\n---\nYour message:\n${c.message}`)}`;

  return (
    <div className="space-y-3 lg:space-y-4">
      {/* Header + filters */}
      <section className="fb-card space-y-3 p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-surface-900 lg:text-2xl">Contact <span className="text-brand-500">messages</span></h1>
            <p className="text-sm text-surface-500">
              {pagination.total} {pagination.total === 1 ? 'message' : 'messages'} · {unread} unread
            </p>
          </div>
          <div className="flex gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => { setStatus(f.id); setPage(1); }}
                className={`h-9 rounded-full px-3 text-sm font-semibold transition-colors ${status === f.id ? 'bg-brand-500/15 text-brand-600' : 'bg-surface-100 text-surface-900 hover:bg-surface-200'}`}
              >
                {f.label}{f.id === 'unread' && unread > 0 ? ` (${unread})` : ''}
              </button>
            ))}
          </div>
        </div>
        <label className="relative block">
          <span className="sr-only">Search messages</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-500" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name, email, subject or message"
            className="h-10 w-full rounded-full border border-transparent bg-surface-100 pl-9 pr-4 text-sm outline-none focus:border-brand-500"
          />
        </label>
      </section>

      {/* List */}
      <section className="fb-card overflow-hidden">
        {loading && contacts.length === 0 ? (
          <div className="divide-y divide-surface-200">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 p-3 sm:p-4">
                <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-surface-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/3 animate-pulse rounded-full bg-surface-100" />
                  <div className="h-3 w-2/3 animate-pulse rounded-full bg-surface-100" />
                </div>
              </div>
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-100 text-surface-500"><Inbox className="h-7 w-7" /></span>
            <p className="font-semibold text-surface-900">No messages found</p>
            <p className="text-sm text-surface-500">Messages from the contact form will appear here.</p>
          </div>
        ) : (
          <ul className={`divide-y divide-surface-200 ${loading ? 'opacity-60' : ''}`}>
            {contacts.map((c) => {
              const open = openId === c._id;
              return (
                <li key={c._id} className={c.isRead ? '' : 'bg-brand-500/5'}>
                  <div className="flex gap-3 p-3 sm:p-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500 font-bold text-white">
                      {(c.name?.[0] || '?').toUpperCase()}
                    </span>

                    <button type="button" onClick={() => toggleOpen(c)} className="min-w-0 flex-1 text-left" aria-expanded={open}>
                      <div className="flex flex-wrap items-center gap-x-2">
                        <p className={`truncate text-[15px] text-surface-900 ${c.isRead ? 'font-medium' : 'font-bold'}`}>{c.name}</p>
                        {!c.isRead && <span className="h-2 w-2 rounded-full bg-brand-500" aria-label="Unread" />}
                        {c.userId && <span className="rounded-full bg-surface-100 px-2 py-0.5 text-xs text-surface-500">Registered user</span>}
                      </div>
                      <p className="truncate text-sm text-surface-500">{c.email}</p>
                      <p className={`mt-1 text-sm text-surface-900 ${c.isRead ? '' : 'font-semibold'}`}>{c.subject}</p>
                      <p className={`mt-0.5 whitespace-pre-wrap break-words text-sm text-surface-500 ${open ? '' : 'line-clamp-2'}`}>{c.message}</p>
                      <p className="mt-1 text-xs text-surface-400">{formatWhen(c.createdAt)}</p>
                    </button>

                    <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row">
                      <a href={replyHref(c)} onClick={() => !c.isRead && setRead(c, true)} className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-white transition hover:brightness-110" title="Reply by email" aria-label="Reply by email">
                        <Reply className="h-4 w-4" />
                      </a>
                      <button type="button" onClick={() => setRead(c, !c.isRead)} className={roundBtn} title={c.isRead ? 'Mark as unread' : 'Mark as read'} aria-label={c.isRead ? 'Mark as unread' : 'Mark as read'}>
                        {c.isRead ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
                      </button>
                      <button type="button" onClick={() => remove(c)} className={`${roundBtn} hover:text-coral-600`} title="Delete" aria-label="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className={`${roundBtn} disabled:opacity-40`} aria-label="Previous page">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-surface-500">Page {page} of {pagination.totalPages}</span>
          <button type="button" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)} className={`${roundBtn} disabled:opacity-40`} aria-label="Next page">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
