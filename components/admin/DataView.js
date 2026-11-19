'use client';

import { Table2, List, LayoutGrid, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { roundBtn, ListSkeleton, EmptyState } from './ui';
import MobileFilters from '@/components/MobileFilters';

/*
 * One column definition renders three layouts:
 *   columns: [{ key, header, render(row), primary?, actions?, align?, className? }]
 *   - table: every column
 *   - list:  primary column on the left, the other columns as small "header: value" meta, actions right
 *   - grid:  cards: primary on top, other columns as label/value pairs, actions at the bottom
 */

const VIEWS = [
  { id: 'table', label: 'Table', icon: Table2 },
  { id: 'list', label: 'List', icon: List },
  { id: 'grid', label: 'Grid', icon: LayoutGrid },
];

export function ViewToggle({ view, onChange }) {
  return (
    <div className="flex items-center gap-0.5 rounded-full bg-surface-100 p-0.5" role="radiogroup" aria-label="Layout">
      {VIEWS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={view === id}
          aria-label={`${label} view`}
          title={`${label} view`}
          onClick={() => onChange(id)}
          className={`flex h-8 w-8 items-center justify-center rounded-full outline-none [.in-drawer_&]:w-auto [.in-drawer_&]:flex-1 transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 ${view === id ? 'bg-surface-50 text-brand-600 shadow-card' : 'text-surface-500 hover:text-surface-900'}`}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}

/** Grey pill select: options [{ value, label }]. The label prefix keeps it readable without a separate label. */
export function SelectField({ label, value, onChange, options }) {
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 appearance-none rounded-full border border-transparent bg-surface-100 pl-3 pr-8 text-sm font-medium text-surface-900 outline-none transition-colors hover:bg-surface-200 focus:border-brand-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{label}: {o.label}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4 text-surface-500" />
    </label>
  );
}

/** Filters (left) + sort and layout (right) in one compact card row. */
export function Toolbar({ children, right }) {
  return (
    <section className="fb-card flex flex-wrap items-center justify-between gap-2 p-2 sm:p-2.5">
      <div className="flex flex-wrap items-center gap-2">{children}</div>
      <div className="flex flex-wrap items-center gap-2">{right}</div>
    </section>
  );
}

const PAGE_SIZES = [10, 20, 50, 100];

export function Pagination({ pagination, onPage, onLimit }) {
  if (!pagination) return null;
  const { page = 1, pages = 1, total = 0, limit = 20 } = pagination;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const summary = (
    <p className="text-sm text-surface-500">
      Showing <span className="font-semibold text-surface-900">{from}–{to}</span> of <span className="font-semibold text-surface-900">{total}</span>
    </p>
  );
  const controls = (
    <div className="flex flex-wrap items-center gap-2">
      <SelectField label="Per page" value={String(limit)} onChange={(v) => onLimit(Number(v))} options={PAGE_SIZES.map((n) => ({ value: String(n), label: n }))} />
      <button type="button" onClick={() => onPage(page - 1)} disabled={page <= 1} className={roundBtn} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
      <span className="min-w-[88px] text-center text-sm text-surface-500">Page {page} of {pages}</span>
      <button type="button" onClick={() => onPage(page + 1)} disabled={page >= pages} className={roundBtn} aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
    </div>
  );
  return (
    <>
      <div className="fb-card hidden flex-wrap items-center justify-between gap-2 p-2.5 sm:p-3 lg:flex">
        {summary}
        {controls}
      </div>
      <MobileFilters title="Pages">
        {summary}
        {controls}
      </MobileFilters>
    </>
  );
}

export default function DataView({ view, columns, rows, rowKey, loading, empty, onRowClick, rowClassName }) {
  if (loading && !rows?.length) return <ListSkeleton />;
  if (!rows?.length) return <EmptyState {...empty} />;

  const primary = columns.find((c) => c.primary) || columns[0];
  const actions = columns.find((c) => c.actions);
  const meta = columns.filter((c) => c !== primary && c !== actions);
  const clickable = onRowClick ? 'cursor-pointer' : '';
  const stop = (e) => e.stopPropagation();
  const dim = loading ? 'opacity-60' : '';

  if (view === 'table') {
    return (
      <table className={`w-full min-w-[760px] text-left text-sm ${dim}`}>
        <thead className="text-surface-500">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={`whitespace-nowrap px-4 py-2.5 font-semibold ${c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : ''}`}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-200">
          {rows.map((row) => (
            <tr key={rowKey(row)} onClick={onRowClick ? () => onRowClick(row) : undefined} className={`transition-colors hover:bg-surface-100 ${clickable} ${rowClassName?.(row) || ''}`}>
              {columns.map((c) => (
                <td key={c.key} onClick={c.actions ? stop : undefined} className={`px-4 py-3 align-middle ${c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : ''} ${c.className || ''}`}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (view === 'list') {
    return (
      <ul className={`divide-y divide-surface-200 ${dim}`}>
        {rows.map((row) => (
          <li key={rowKey(row)} onClick={onRowClick ? () => onRowClick(row) : undefined} className={`flex flex-wrap items-center gap-x-4 gap-y-2 p-3 transition-colors hover:bg-surface-100 sm:p-4 ${clickable} ${rowClassName?.(row) || ''}`}>
            <div className="min-w-[200px] flex-1">{primary.render(row)}</div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {meta.map((c) => (
                <div key={c.key} className="text-sm">
                  <span className="text-surface-500">{c.header}: </span>
                  <span className="text-surface-900">{c.render(row)}</span>
                </div>
              ))}
            </div>
            {actions && <div onClick={stop} className="ml-auto flex items-center gap-1.5">{actions.render(row)}</div>}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className={`grid gap-3 p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-3 ${dim}`}>
      {rows.map((row) => (
        <article key={rowKey(row)} onClick={onRowClick ? () => onRowClick(row) : undefined} className={`flex flex-col gap-3 rounded-lg border border-surface-200 p-3 transition-colors hover:bg-surface-100 ${clickable} ${rowClassName?.(row) || ''}`}>
          {primary.render(row)}
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
            {meta.map((c) => (
              <div key={c.key} className="min-w-0">
                <dt className="text-xs text-surface-500">{c.header}</dt>
                <dd className="truncate text-sm text-surface-900">{c.render(row)}</dd>
              </div>
            ))}
          </dl>
          {actions && <div onClick={stop} className="mt-auto flex justify-end gap-1.5 border-t border-surface-200 pt-2">{actions.render(row)}</div>}
        </article>
      ))}
    </div>
  );
}
