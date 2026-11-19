'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Mail, CheckCheck, Coins } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api from '@/lib/api';

export const NOTIFICATIONS_CHANGED = 'adaptuai:notifications-changed';
const POLL_MS = 60 * 1000;

// Icon + colour per notification type.
const TYPE_ICON = {
  contact: { icon: Mail, cls: 'bg-brand-500/15 text-brand-600' },
  recharge: { icon: Coins, cls: 'bg-accent-500/15 text-accent-600' },
};

/**
 * Navbar bell (admins and learners): unread count badge + Facebook-style dropdown of the latest notifications.
 *   endpoint  '/admin/notifications' or '/user/notifications'
 *   seeAll    { href, label } link under the list
 *   onNew     called when the unread count goes up (e.g. refresh the AU balance after a recharge)
 * Refreshes every minute, when the tab becomes visible again, when the dropdown opens, and when
 * another part of the app fires the NOTIFICATIONS_CHANGED event (e.g. a contact marked read).
 */
export default function NotificationBell({
  className = '',
  endpoint = '/admin/notifications',
  seeAll = { href: '/admin/contacts', label: 'See all contact messages' },
  emptyText = 'New contact messages will show up here.',
  onNew,
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  const lastUnread = useRef(null);

  const load = useCallback(async () => {
    try {
      const data = await api.get(`${endpoint}?limit=15`);
      const count = data.unread || 0;
      if (lastUnread.current != null && count > lastUnread.current) onNew?.();
      lastUnread.current = count;
      setItems(data.notifications || []);
      setUnread(count);
    } catch { /* keep the last known state */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  useEffect(() => {
    load();
    const timer = setInterval(() => { if (document.visibilityState === 'visible') load(); }, POLL_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener(NOTIFICATIONS_CHANGED, load);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener(NOTIFICATIONS_CHANGED, load);
    };
  }, [load]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) { setLoading(true); await load(); setLoading(false); }
  };

  const openItem = async (n) => {
    setOpen(false);
    if (!n.isRead) {
      setItems((list) => list.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)));
      setUnread((u) => Math.max(u - 1, 0));
      lastUnread.current = Math.max((lastUnread.current || 1) - 1, 0);
      api.patch(endpoint, { id: n._id }).catch(() => {});
    }
    if (n.link) router.push(n.link);
  };

  const markAll = async () => {
    setItems((list) => list.map((x) => ({ ...x, isRead: true })));
    setUnread(0);
    lastUnread.current = 0;
    try { await api.patch(endpoint, { all: true }); } catch { load(); }
  };

  const badge = unread > 99 ? '99+' : unread;

  return (
    <div className={`relative shrink-0 ${className}`} ref={ref}>
      <button
        type="button"
        onClick={toggle}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
        title="Notifications"
        className={`relative flex h-8 w-8 items-center sm:h-10 sm:w-10 justify-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 ${open ? 'bg-brand-500/15 text-brand-600' : 'bg-surface-100 text-surface-900 hover:bg-surface-200'}`}
      >
        <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-surface-50 bg-coral-500 px-1 text-[11px] font-bold leading-none text-white">
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-2 top-[calc(var(--navbar-h)+4px)] z-50 rounded-lg bg-surface-50 shadow-menu animate-fade-in sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[360px]">
          <div className="flex items-center justify-between px-3 pb-1 pt-3">
            <h2 className="text-xl font-bold text-surface-900">Notifications</h2>
            {unread > 0 && (
              <button type="button" onClick={markAll} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-brand-600 hover:bg-surface-100">
                <CheckCheck className="h-4 w-4" /> Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-[min(70dvh,480px)] overflow-y-auto p-1.5">
            {loading && items.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-surface-500">Loading…</p>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-100 text-surface-500"><Bell className="h-6 w-6" /></span>
                <p className="font-semibold text-surface-900">No notifications yet</p>
                <p className="text-sm text-surface-500">{emptyText}</p>
              </div>
            ) : (
              items.map((n) => {
                const { icon: TypeIcon, cls } = TYPE_ICON[n.type] || TYPE_ICON.contact;
                return (
                <button
                  key={n._id}
                  type="button"
                  onClick={() => openItem(n)}
                  className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-surface-100"
                >
                  <span className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${cls}`}>
                    <TypeIcon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm text-surface-900 ${n.isRead ? '' : 'font-semibold'}`}>{n.title}</span>
                    {n.body && <span className="block truncate text-sm text-surface-500">{n.body}</span>}
                    <span className={`block text-xs ${n.isRead ? 'text-surface-500' : 'font-semibold text-brand-600'}`}>
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </span>
                  </span>
                  {!n.isRead && <span className="h-3 w-3 shrink-0 rounded-full bg-brand-500" aria-label="Unread" />}
                </button>
                );
              })
            )}
          </div>

          <div className="border-t border-surface-200 p-1.5">
            <button
              type="button"
              onClick={() => { setOpen(false); router.push(seeAll.href); }}
              className="w-full rounded-lg py-2 text-sm font-semibold text-brand-600 hover:bg-surface-100"
            >
              {seeAll.label}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
