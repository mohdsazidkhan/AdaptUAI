'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navFor, isActivePath } from '@/lib/navItems';

// Mobile/tablet tab bar (below lg) for signed-in users. Hidden on the full-height AI Tutor chat.
export default function BottomNav({ user }) {
  const pathname = usePathname();
  if (!user || pathname === '/user/chat' || pathname?.startsWith('/auth')) return null;
  const tabs = navFor(user).filter((i) => i.tab);

  return (
    <>
      {/* Spacer so page content never hides under the fixed bar */}
      <div className="h-14 lg:hidden" aria-hidden="true" />
      <nav
        className="fixed inset-x-0 bottom-0 z-50 flex h-14 border-t border-surface-200 bg-surface-50 pb-[env(safe-area-inset-bottom)] lg:hidden"
        aria-label="Bottom navigation"
      >
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = isActivePath(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${active ? 'text-brand-500' : 'text-surface-500'}`}
            >
              {active && <span className="absolute inset-x-3 top-0 h-[3px] rounded-full bg-brand-500" />}
              <Icon className="h-6 w-6" strokeWidth={active ? 2.4 : 2} />
              <span className="max-w-full truncate px-1">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
