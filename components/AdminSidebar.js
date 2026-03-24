'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const adminLinks = [
  { href: '/admin/dashboard', label: 'Overview', icon: '📊' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/chats', label: 'Global Chats', icon: '💬' },
  { href: '/admin/transactions', label: 'Transactions', icon: '💸' },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-surface-900 text-white flex flex-col h-screen fixed left-0 top-0 z-50">
      <div className="p-6">
        <h1 className="text-xl font-black tracking-tighter flex items-center gap-2">
          <span className="text-brand-500">AdaptUAI</span>
          <span className="text-[10px] bg-red-500 px-1.5 py-0.5 rounded uppercase font-black">Admin</span>
        </h1>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {adminLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                isActive 
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' 
                  : 'text-surface-400 hover:bg-surface-800 hover:text-white'
              }`}
            >
              <span className="text-lg">{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-surface-800">
        <Link 
          href="/user/dashboard"
          className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-surface-400 hover:bg-surface-800 hover:text-white transition-all"
        >
          <span>🏠</span>
          Back to App
        </Link>
      </div>
    </div>
  );
}
