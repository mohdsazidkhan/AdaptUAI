'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const adminLinks = [
  { href: '/admin/dashboard', label: 'Overview', icon: '📊' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/chats', label: 'Global Chats', icon: '💬' },
  { href: '/admin/transactions', label: 'Transactions', icon: '💸' },
  { href: '/admin/profile', label: 'My Profile', icon: '👤' },
];

export default function AdminSidebar({ isOpen, setIsOpen, user }) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed top-16 inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm z-[30] lg:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div 
        className={`fixed top-16 left-0 w-64 h-[calc(100vh-4rem)] bg-surface-50 border-r border-surface-200 dark:border-surface-100/10 flex flex-col z-[40] transition-transform duration-300 ease-in-out transform
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="px-6 py-2 flex items-center justify-end lg:hidden">
          {/* Close button for mobile */}
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg text-surface-400 hover:text-surface-900 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User Summary (Same Pattern as User Sidebar) */}
        {user && (
          <div className="p-4 bg-surface-50 border-b border-surface-100 dark:border-surface-100/10">
            <div className="flex items-center gap-3 p-3 bg-surface-100 border-2 border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden">
              <img
                src={user.avatarUrl || `https://api.dicebear.com/8.x/fun-emoji/svg?seed=${encodeURIComponent(user.name || 'admin')}`}
                alt={user.name}
                className="w-12 h-12 rounded-xl bg-surface-100 border border-surface-200 flex items-center justify-center text-xl overflow-hidden"
              />
              <div className="min-w-0">
                <p className="font-bold text-surface-900 truncate text-sm">{user.name}</p>
                <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest mt-0.5">
                  🛡️ System Admin
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold text-surface-400 uppercase tracking-tight">Root Access</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {adminLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-150 group ${isActive
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-surface-700 hover:bg-surface-100 hover:text-surface-900'
                }`}
              >
                <span className={`text-xl transition-transform ${isActive ? '' : 'group-hover:scale-110'}`}>
                  {link.icon}
                </span>
                {link.label}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white opacity-80" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Status Tip (Same Pattern as User Sidebar) */}
        <div className="px-5 mb-6">
          <div className="bg-ocean-50 border border-ocean-100 rounded-xl p-4">
            <p className="text-xs font-bold text-ocean-700 mb-1">🛡️ System Status</p>
            <p className="text-[10px] text-ocean-600 leading-relaxed font-semibold">
              All services operational. Token consumption and user streak tracking are active.
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-surface-100 dark:border-surface-100/10">
          <p className="text-[10px] text-surface-400 font-bold uppercase tracking-widest text-center italic">Admin Console v1.0</p>
        </div>
      </div>
    </>
  );
}
