'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const adminLinks = [
  { href: '/admin/dashboard', label: 'Overview', icon: '📊' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/chats', label: 'Global Chats', icon: '💬' },
  { href: '/admin/transactions', label: 'Transactions', icon: '💸' },
];

export default function AdminSidebar({ isOpen, setIsOpen }) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div 
        className={`fixed inset-y-0 left-0 w-64 bg-surface-900 dark:bg-surface-50 text-white flex flex-col h-screen z-[70] transition-transform duration-300 ease-in-out transform 
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="p-6 flex items-center justify-between">
          <h1 className="text-xl font-black tracking-tighter flex items-center gap-2">
            <span className="text-brand-500 text-2xl">🦉</span>
            <span>AdaptUAI</span>
          </h1>
          {/* Close button for mobile */}
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 hover:bg-surface-800 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {adminLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                    : 'text-surface-400 hover:text-white hover:bg-surface-800'
                }`}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-surface-800 dark:border-surface-100/10">
          <Link 
            href="/user/dashboard"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-surface-800 hover:bg-surface-700 rounded-xl text-sm font-black transition-all border border-surface-700"
          >
            ← Back to App
          </Link>
        </div>
      </div>
    </>
  );
}
