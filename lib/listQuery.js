/**
 * Shared parsing for admin list APIs: ?page=&limit=&search=&sort=&range=
 * - page >= 1, limit 1..100 (default 20)
 * - sort must be one of the route's allowed keys (else the route default)
 * - search is regex-escaped (case-insensitive "contains")
 * - range: 24h | 7d | 30d | 90d -> a "from" Date
 */
export const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const RANGES = { '24h': 1, '7d': 7, '30d': 30, '90d': 90 };

export function parseListQuery(request, { sorts, defaultSort, defaultLimit = 20, maxLimit = 100 }) {
  const sp = new URL(request.url).searchParams;
  const page = Math.max(parseInt(sp.get('page'), 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(sp.get('limit'), 10) || defaultLimit, 1), maxLimit);
  const search = (sp.get('search') || '').trim().slice(0, 100);
  const sortKey = sorts[sp.get('sort')] ? sp.get('sort') : defaultSort;
  const rangeDays = RANGES[sp.get('range')];
  return {
    sp,
    page,
    limit,
    skip: (page - 1) * limit,
    search,
    searchRx: search ? new RegExp(escapeRegex(search), 'i') : null,
    sortKey,
    sort: sorts[sortKey],
    from: rangeDays ? new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000) : null,
  };
}

export const paginationOf = (page, limit, total) => ({ page, limit, total, pages: Math.max(Math.ceil(total / limit), 1) });
