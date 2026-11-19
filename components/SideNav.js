'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isActivePath, avatarFor } from '@/lib/navItems';
import { LegalLinks } from './Footer';

/**
 * Facebook-style left rail (desktop only, lg+): profile row, then links with round icon chips.
 * The active link is a solid brand row. Sits under the fixed navbar on the card surface.
 */
export default function SideNav({ user, items, subtitle, profileHref, children }) {
  const pathname = usePathname();

  return (
    <aside className="app-sidebar fixed bottom-0 left-0 top-navbar z-40 hidden w-sidebar flex-col overflow-y-auto border-r border-surface-200 bg-surface-50 p-2 lg:flex">
      {user && (
        <Link href={profileHref} className="mb-1 flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-surface-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatarFor(user)} alt="" className="h-9 w-9 rounded-full bg-surface-100 object-cover" />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold text-surface-900">{user.name}</p>
            {subtitle && <p className="truncate text-xs text-surface-500">{subtitle}</p>}
          </div>
        </Link>
      )}

      <nav className="space-y-0.5" aria-label="Sidebar">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActivePath(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-lg p-2 text-[15px] font-medium transition-colors ${active ? 'bg-brand-500 text-white' : 'text-surface-900 hover:bg-surface-100'}`}
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-full ${active ? 'bg-white/20' : 'bg-surface-100'}`}>
                <Icon className="h-5 w-5" />
              </span>
              {label}
            </Link>
          );
        })}
      </nav>

      {children && <div className="mt-2 border-t border-surface-200 pt-3">{children}</div>}

      <LegalLinks className="mt-auto px-2 pb-1 pt-4" />
    </aside>
  );
}
