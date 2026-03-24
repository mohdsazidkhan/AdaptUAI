'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ProgressBar from './ProgressBar';
import { getProfileLabel } from '../lib/userProfile';

const navItems = [
  { href: '/user/dashboard', icon: '🏠', label: 'Dashboard' },
  { href: '/user/chat', icon: '🦉', label: 'AI Tutor' },
  { href: '/user/chats', icon: '💬', label: 'Sessions' },
  { href: '/user/wallet', icon: '🪙', label: 'Wallet' },
  { href: '/user/transactions', icon: '📜', label: 'History' },
  { href: '/user/profile', icon: '👤', label: 'Profile' },
];

export default function Sidebar({ user }) {
  const pathname = usePathname();

  const auProgress =
    user?.level
      ? Math.min(Math.round(((user.au - (user.level - 1) * 100) / 100) * 100), 100)
      : 0;

  return (
    <aside className="hidden lg:flex w-64 flex-col bg-surface-50 border-r border-surface-200 min-h-screen pt-20 pb-6">
      {/* User Summary */}
      {user && (
        <div className="p-4 bg-surface-50 border-t border-surface-100">
          <div className="flex items-center gap-3 p-3 bg-surface-100 border-2 border-surface-200 rounded-xl overflow-hidden">
            <img
              src={user.avatarUrl || `https://api.dicebear.com/8.x/fun-emoji/svg?seed=${encodeURIComponent(user.name || 'user')}`}
              alt={user.name}
              className="w-12 h-12 rounded-xl bg-surface-100 border border-surface-200 flex items-center justify-center text-xl overflow-hidden"
            />
            <div className="min-w-0">
              <p className="font-bold text-surface-900 truncate text-sm">{user.name}</p>
              {user.mindsetProfile && (
                <p className="text-[10px] font-semibold text-brand-500 truncate mt-0.5">
                  ✨ {getProfileLabel(user.mindsetProfile)}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold text-accent-600">⚡ {user.au} AU</span>
                {user.streak > 0 && (
                  <span className="text-xs font-bold text-coral-500">🔥 {user.streak}</span>
                )}
              </div>
            </div>
          </div>

          {/* Wallet summary small */}
          <div className="mt-3 px-1">
            <Link href="/user/wallet" className="block p-3 bg-brand-50 rounded-xl border border-brand-100 group hover:border-brand-200 transition-all">
              <div className="flex justify-between items-center text-[10px] font-black uppercase text-brand-600 mb-1">
                <span>Wallet Status</span>
                <span>Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-brand-900">{user.au} AU</span>
                <span className="text-[10px] font-bold text-brand-500 group-hover:underline">Recharge →</span>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-150 group ${isActive
                ? 'bg-brand-500 text-white shadow-sm'
                : 'text-surface-700 hover:bg-surface-50 hover:text-surface-900'
                }`}
            >
              <span className={`text-xl transition-transform ${isActive ? '' : 'group-hover:scale-110'}`}>
                {item.icon}
              </span>
              {item.label}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white opacity-80" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom tip */}
      <div className="px-5 mt-6">
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
          <p className="text-xs font-bold text-purple-700 mb-1">💡 Daily Tip</p>
          <p className="text-xs text-purple-600 leading-relaxed">
            Consistent daily practice builds deeper understanding. Even 10 minutes a day helps!
          </p>
        </div>
      </div>
    </aside>
  );
}
