'use client';

import Link from 'next/link';
import { Coins, Flame, Sparkles } from 'lucide-react';
import SideNav from './SideNav';
import { USER_NAV } from '@/lib/navItems';
import { getProfileLabel } from '../lib/userProfile';

export default function Sidebar({ user }) {
  return (
    <SideNav
      user={user}
      items={USER_NAV}
      profileHref="/user/profile"
      subtitle={user ? `Level ${user.level || 1}${user.streak > 0 ? ` · ${user.streak} day streak` : ''}` : ''}
    >
      {user && (
        <div className="space-y-2 px-2">
          <p className="text-[15px] font-semibold text-surface-500">Your learning</p>

          <Link href="/user/wallet" className="flex items-center gap-3 rounded-lg p-2 -mx-2 transition-colors hover:bg-surface-100">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-100 text-accent-600"><Coins className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-surface-900">{user.au} AU</p>
              <p className="text-xs text-surface-500">Balance · Recharge</p>
            </div>
          </Link>

          {user.streak > 0 && (
            <div className="flex items-center gap-3 p-2 -mx-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-100 text-accent-600"><Flame className="h-5 w-5" /></span>
              <p className="text-sm font-semibold text-surface-900">{user.streak} day streak</p>
            </div>
          )}

          {user.mindsetProfile && (
            <div className="flex items-center gap-3 p-2 -mx-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-600"><Sparkles className="h-5 w-5" /></span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-surface-900">{getProfileLabel(user.mindsetProfile)}</p>
                <p className="text-xs text-surface-500">Your learning style</p>
              </div>
            </div>
          )}

          <p className="pt-2 text-xs leading-relaxed text-surface-500">
            Tip: even 10 minutes of practice a day builds deeper understanding.
          </p>
        </div>
      )}
    </SideNav>
  );
}
