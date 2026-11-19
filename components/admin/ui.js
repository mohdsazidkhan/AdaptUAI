'use client';

import Link from 'next/link';
import { Search, ArrowLeft } from 'lucide-react';
import MobileFilters from '@/components/MobileFilters';

/*
 * Small Facebook-style building blocks for the admin pages, so every page has the same look and
 * readable contrast in light and dark mode: primary text = surface-900, secondary = surface-500
 * (never surface-400 for text that matters), tinted chips use the brand/coral/accent 500-600 shades.
 */

export const card = 'fb-card';

export const roundBtn =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-100 text-surface-900 outline-none transition-colors hover:bg-surface-200 focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-40';

export const greyBtn =
  'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-surface-100 px-3 text-sm font-semibold text-surface-900 outline-none transition-colors hover:bg-surface-200 focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-40';

export const brandBtn =
  'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-3 text-sm font-semibold text-white outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-40';

export const searchInput =
  'h-10 w-full rounded-full border border-transparent bg-surface-100 pl-9 pr-4 text-sm text-surface-900 outline-none placeholder:text-surface-400 focus:border-brand-500';

/**
 * Page title card: title (last word in brand colour) + subtitle on the left, optional search in the
 * centre of the same row on desktop (full width under the title on phones), actions on the right.
 */
export function PageHeader({ title, subtitle, actions, back, search, filters, count }) {
  const words = String(title).trim().split(' ');
  const last = words.length > 1 ? words.pop() : null;
  return (
    <section className={`${card} flex flex-wrap items-center gap-2 p-2.5 sm:p-3`}>
      <div className="flex min-w-0 items-center gap-2">
        {back && (
          <Link href={back.href} aria-label={`Back to ${back.label}`} title={`Back to ${back.label}`} className={roundBtn}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold text-surface-900 lg:text-xl">
            {last ? <>{words.join(' ')} <span className="text-brand-500">{last}</span></> : title}
          </h1>
          {subtitle && <p className="truncate text-sm text-surface-500">{subtitle}</p>}
        </div>
        {count != null && <Pill>{count}</Pill>}
      </div>
      <div className="flex-1" />
      {/* Desktop: search grows in the middle of the row, then filters and actions */}
      {search && <div className="hidden min-w-[200px] flex-1 lg:block">{search}</div>}
      {filters && <div className="hidden flex-wrap items-center gap-2 lg:flex">{filters}</div>}
      {actions && <div className={`items-center gap-2 ${search || filters ? 'hidden lg:flex' : 'flex'}`}>{actions}</div>}
      {/* Phones/tablets: the same controls live in the navbar's Filters drawer */}
      {(search || filters) && (
        <MobileFilters>
          {search}
          {filters && <div className="flex flex-col gap-2 [&>*]:w-full">{filters}</div>}
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </MobileFilters>
      )}
    </section>
  );
}

/** Rounded search field for the PageHeader search slot. */
export function SearchField({ value, onChange, placeholder, label = 'Search' }) {
  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-500" />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={searchInput} />
    </label>
  );
}

const TONES = {
  brand: 'bg-brand-500/15 text-brand-600',
  coral: 'bg-coral-500/15 text-coral-600',
  accent: 'bg-accent-500/15 text-accent-600',
  grey: 'bg-surface-100 text-surface-900',
};

/** Stat tile: round tinted icon, value, label. */
export function StatCard({ icon: Icon, label, value, tone = 'brand', hint }) {
  return (
    <div className={`${card} flex items-center gap-3 p-3 sm:p-4`}>
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${TONES[tone]}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-sm text-surface-500">{label}</p>
        <p className="text-xl font-bold text-surface-900 lg:text-2xl">{value ?? '–'}</p>
        {hint && <p className="text-xs text-surface-500">{hint}</p>}
      </div>
    </div>
  );
}

/** Small rounded label. */
export function Pill({ children, tone = 'grey', className = '' }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${TONES[tone]} ${className}`}>{children}</span>;
}

/** Round icon button with a styled tooltip (desktop hover / keyboard focus).
 *  tip="top" opens the tooltip above: use it inside tables/lists so it never causes scrollbars. */
export function IconButton({ icon: Icon, label, onClick, href, danger = false, disabled = false, tip = 'bottom' }) {
  // In the Filters drawer the button becomes a full-width row with its text next to the icon.
  const cls = `${roundBtn} ${danger ? 'hover:text-coral-600' : ''} [.in-drawer_&]:w-full [.in-drawer_&]:justify-center [.in-drawer_&]:gap-2 [.in-drawer_&]:rounded-lg [.in-drawer_&]:px-3`;
  const inner = <><Icon className="h-4 w-4" /><span className="hidden text-sm font-semibold [.in-drawer_&]:inline">{label}</span></>;
  return (
    <span className="group relative inline-flex [.in-drawer_&]:w-full">
      {href ? (
        <Link href={href} aria-label={label} className={cls}>{inner}</Link>
      ) : (
        <button type="button" onClick={onClick} aria-label={label} disabled={disabled} className={cls}>{inner}</button>
      )}
      <span role="tooltip" className={`pointer-events-none absolute z-30 [.in-drawer_&]:hidden ${tip === 'top' ? 'bottom-full right-0 mb-1.5' : 'right-1/2 top-full mt-1.5 translate-x-1/2'}`}><span className="block whitespace-nowrap rounded-md bg-surface-900 px-2 py-1 text-xs font-medium text-surface-50 opacity-0 shadow-menu transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        {label}
      </span></span>
    </span>
  );
}

/** Empty list placeholder. */
export function EmptyState({ icon: Icon, title, text }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-2 px-4 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-100 text-surface-500"><Icon className="h-7 w-7" /></span>
      <p className="font-semibold text-surface-900">{title}</p>
      {text && <p className="text-sm text-surface-500">{text}</p>}
    </div>
  );
}

/** Grey skeleton rows while a list loads. */
export function ListSkeleton({ rows = 4 }) {
  return (
    <div className="divide-y divide-surface-200">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex gap-3 p-3 sm:p-4">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-surface-100" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 animate-pulse rounded-full bg-surface-100" />
            <div className="h-3 w-2/3 animate-pulse rounded-full bg-surface-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '–';
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '–');
