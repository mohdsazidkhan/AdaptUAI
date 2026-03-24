'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Button from './Button';
import { useTheme } from './ThemeProvider';
import AUBadge from './AUBadge';
import api from '@/lib/api';

export default function Navbar({ user }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [mobileMenuOpen]);

  async function handleLogout() {
    try {
      await api.post('/auth/logout');
      router.push('/');
      router.refresh();
    } catch {
      router.push('/');
    }
  }

  const navLinks = [
    { href: '/user/dashboard', label: 'Dashboard', icon: '🏠', authRequired: true, hideOnDesktop: true },
    { href: '/user/chat', label: 'Learn', icon: '🦉', authRequired: true, hideOnDesktop: true },
    { href: '/user/chats', label: 'Sessions', icon: '💬', authRequired: true, hideOnDesktop: true },
    { href: '/user/wallet', label: 'Wallet', icon: '🪙', authRequired: true, hideOnDesktop: true },
    { href: '/user/transactions', label: 'History', icon: '📜', authRequired: true, hideOnDesktop: true },
    { href: '/user/profile', label: 'Profile', icon: '👤', authRequired: true, hideOnDesktop: true },
    { href: '/auth/login', label: 'Log In', icon: '🔑', authRequired: false, hideOnDesktop: true },
    { href: '/auth/signup', label: 'Get Started', icon: '🚀', authRequired: false, hideOnDesktop: true },
  ];

  const filteredLinks = navLinks.filter(link => {
    if (link.authRequired && !user) return false;
    if (link.hideOnDesktop) return false; // Handled separately in the UI
    return true;
  });

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-surface-200 ${scrolled ? 'bg-surface-50/95 backdrop-blur-md shadow-md' : 'bg-surface-50/90 backdrop-blur-sm'
          }`}
      >
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href={user ? '/user/dashboard' : '/'} className="flex items-center gap-2 group">
              <span className="text-2xl group-hover:animate-bounce-slow transition-all">🦉</span>
              <span className="text-xl font-black">
                <span className="text-surface-900">AdaptU</span>
                <span className="text-brand-500">AI</span>
              </span>
              <span className="hidden sm:inline-block h-4 w-px bg-surface-200 mx-1" />
              <span className="hidden md:inline-block text-[10px] font-bold text-surface-400 tracking-widest uppercase">
                AI that adapts to you
              </span>
            </Link>

            {/* Desktop Nav */}
            {user && (
              <nav className="hidden md:flex items-center gap-1">
                {filteredLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-150 ${pathname === link.href
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'
                      }`}
                  >
                    <span>{link.icon}</span>
                    {link.label}
                  </Link>
                ))}
              </nav>
            )}

            {/* Right side */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl bg-surface-100 hover:bg-surface-200 text-surface-600 transition-all active:scale-95"
                aria-label="Toggle Theme"
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>

              {user ? (
                <>
                  {/* AU Badge (compact) */}
                  <div className="hidden sm:block">
                    <AUBadge xp={user.au} level={user.level} streak={user.streak} compact />
                  </div>

                  {/* Avatar dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                      className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-brand-300 transition-all"
                    >
                      <img
                        src={user.avatarUrl || `https://api.dicebear.com/8.x/fun-emoji/svg?seed=${encodeURIComponent(user.name)}`}
                        alt={user.name}
                        className="w-9 h-9 rounded-full bg-brand-100 object-cover border-2 border-brand-200"
                      />
                    </button>

                    {userDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-52 bg-surface-50 rounded-xl shadow-xl border border-surface-200 py-1 animate-scale-in z-50">
                        <div className="px-4 py-3 border-b border-surface-100">
                          <p className="font-bold text-surface-900 truncate">{user.name}</p>
                          <p className="text-xs text-surface-500 truncate">{user.email}</p>
                        </div>
                        <Link
                          href="/user/profile"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 font-medium"
                        >
                          👤 View Profile
                        </Link>
                        <Link
                          href="/user/dashboard"
                          onClick={() => setUserDropdownOpen(false) || setMobileMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-surface-700 hover:bg-surface-50 font-medium"
                        >
                          🏠 Dashboard
                        </Link>
                        <hr className="my-1 border-surface-100" />
                        <button
                          onClick={handleLogout}
                          className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-coral-600 hover:bg-coral-50 font-medium"
                        >
                          🚪 Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="hidden xs:flex items-center gap-2">
                  <Link
                    href="/auth/login"
                    className="px-4 py-2 text-sm font-semibold text-surface-700 hover:text-surface-900 hover:bg-surface-100 rounded-xl transition-all"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="px-4 py-2 text-sm font-bold bg-brand-500 text-white rounded-xl hover:bg-brand-600 shadow-button border-b-2 border-brand-700 hover:translate-y-[1px] hover:shadow-button-press transition-all"
                  >
                    Get Started
                  </Link>
                </div>
              )}

              {/* Mobile hamburger */}
              <button
                className="md:hidden p-2 rounded-xl hover:bg-surface-100 transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <div className={`w-5 h-0.5 bg-surface-600 mb-1.5 transition-transform ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                <div className={`w-5 h-0.5 bg-surface-600 mb-1.5 transition-opacity ${mobileMenuOpen ? 'opacity-0' : ''}`} />
                <div className={`w-5 h-0.5 bg-surface-600 transition-transform ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
              </button>
            </div>
          </div>
        </div>

      </header>

      {/* Mobile Side Drawer - Outside header to avoid z-index/transform issues */}
      <div
        className={`fixed inset-0 z-[100] md:hidden transition-all duration-300 ${mobileMenuOpen ? 'visible' : 'invisible'
          }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100' : 'opacity-0'
            }`}
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Sidebar Drawer Container */}
        <div
          className={`absolute inset-y-0 left-0 w-[280px] bg-surface-50 shadow-2xl transition-transform duration-300 ease-out transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
          <div className="h-full flex flex-col bg-surface-50">
            {/* Header Area */}
            <div className="p-6 border-b border-surface-200 flex items-center justify-between bg-surface-50">
              <Link href={user ? '/user/dashboard' : '/'} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2">
                <span className="text-2xl">🦉</span>
                <span className="text-xl font-black text-surface-900 leading-none">AdaptUAI</span>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl bg-surface-100 text-surface-500 hover:text-surface-900 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Nav Links */}
            <div className="flex-1 overflow-y-auto py-3 lg:py-6 px-2 lg:px-4 space-x-2 lg:space-y-2 bg-surface-50">
              {navLinks.filter(link => {
                if (link.authRequired && !user) return false;
                if (user && !link.authRequired) return false;
                return true;
              }).map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-4 px-3 lg:px-5 py-2 lg:py-4 rounded-xl lg:rounded-xl font-bold text-base transition-all ${isActive
                      ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20 translate-x-1'
                      : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900 border border-transparent hover:border-surface-200'
                      }`}
                  >
                    <span className="text-2xl">{link.icon}</span>
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* User Profile / Logout */}
            {user && (
              <div className="p-4 border-t border-surface-200 bg-surface-100/30">
                <div className="p-4 bg-white dark:bg-surface-100 rounded-xl lg:rounded-3xl border border-surface-200 mb-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={user.avatarUrl || `https://api.dicebear.com/8.x/fun-emoji/svg?seed=${encodeURIComponent(user.name)}`}
                      alt={user.name}
                      className="w-10 h-10 rounded-full border-2 border-brand-100"
                    />
                    <div className="min-w-0">
                      <p className="font-black text-surface-900 truncate text-xs">{user.name}</p>
                      <p className="text-[10px] text-surface-400 font-bold uppercase tracking-widest mt-0.5">Level {user.level} Tutor</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 bg-surface-50 rounded-xl border border-surface-100">
                    <span className="text-[10px] font-black uppercase text-surface-400">Balance</span>
                    <span className="text-xs font-black text-brand-600">{user.au} AU</span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-coral-50 hover:bg-coral-100 text-coral-600 rounded-xl font-black text-sm transition-all border border-coral-200/50"
                >
                  Sign Out 🚪
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
