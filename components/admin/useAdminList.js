'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import api from '@/lib/api';

/**
 * State + fetching for an admin list API with server-side search / filters / sort / pagination.
 *   const list = useAdminList('/admin/users', { sort: 'newest', style: 'all' });
 *   list.data      -> last API response
 *   list.params    -> { page, limit, sort, ...filters, search }
 *   list.set({ sort: 'name' })  -> changes params (back to page 1 unless `page` is given)
 *   list.searchInput / setSearchInput -> the search box (applied 400ms after typing stops)
 * Filters with the value 'all' or '' are not sent.
 */
export function useAdminList(endpoint, initial = {}) {
  const [params, setParams] = useState({ page: 1, limit: 20, search: '', ...initial });
  const [searchInput, setSearchInput] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setParams((p) => (p.search === searchInput.trim() ? p : { ...p, search: searchInput.trim(), page: 1 }));
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== '' && v !== 'all' && v != null).map(([k, v]) => [k, String(v)])
      );
      const res = await api.get(`${endpoint}?${qs}`);
      if (id === requestId.current) setData(res); // ignore answers to older requests
    } catch (err) {
      if (id === requestId.current) setError(err.message || 'Could not load the list');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [endpoint, params]);

  useEffect(() => { load(); }, [load]);

  const set = useCallback((patch) => setParams((p) => ({ ...p, page: 1, ...patch })), []);

  return { params, set, searchInput, setSearchInput, data, setData, loading, error, reload: load };
}

/**
 * Table on desktop, grid on phones by default; the choice is remembered per page on this device.
 */
export function useViewMode(storageKey) {
  const [view, setViewState] = useState('table');
  useEffect(() => {
    let saved = null;
    try { saved = localStorage.getItem(`adaptuai-view-${storageKey}`); } catch { /* storage blocked */ }
    if (['table', 'list', 'grid'].includes(saved)) setViewState(saved);
    else setViewState(window.matchMedia('(min-width: 1024px)').matches ? 'table' : 'grid');
  }, [storageKey]);
  const setView = (v) => {
    setViewState(v);
    try { localStorage.setItem(`adaptuai-view-${storageKey}`, v); } catch { /* storage blocked */ }
  };
  return [view, setView];
}
