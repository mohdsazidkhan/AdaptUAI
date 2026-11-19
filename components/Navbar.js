'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Menu, X, Moon, Sun, LogOut, Coins, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { usePageFilters, pageFilters } from '@/lib/pageFilters';
import { useTheme } from './ThemeProvider';
import api from '@/lib/api';
import { navFor, homeFor, isActivePath, avatarFor } from '@/lib/navItems';

// Round grey icon button used for every header action (Facebook style).
const roundBtn =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-100 text-surface-900 outline-none transition-colors hover:bg-surface-200 focus-visible:ring-2 focus-visible:ring-brand-500';

export function Logo({ href = '/', onClick }) {
  return (
    <Link href={href} onClick={onClick} className="flex shrink-0 items-center gap-1.5">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-xl">🦉</span>
      <span className="text-xl font-bold leading-none">
        <span className="text-surface-900">AdaptU</span>
        <span className="text-brand-500">AI</span>
      </span>
    </Link>
  );
}

export default function Navbar({ user }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [sidebarClosed, setSidebarClosed] = useState(false);
  const menuRef = useRef(null);
  // Signed-in app pages have the left sidebar; landing, legal and auth pages do not.
  const hasSidebar = !!user && /^\/(user|admin)(\/|$)/.test(pathname || '');
  const togglesSidebar = hasSidebar && isDesktop;
  const menuShowsClose = togglesSidebar ? !sidebarClosed : drawerOpen;

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const sync = () => setIsDesktop(mq.matches);
    sync();
    setSidebarClosed(document.documentElement.classList.contains('sidebar-closed'));
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const items = navFor(user);
  const tabs = items.filter((i) => i.tab);
  const isAdmin = user?.role === 'admin';
  const profileHref = isAdmin ? '/admin/profile' : '/user/profile';

  // Close the account menu on outside click / Escape, and both menus on navigation.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDown = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [menuOpen]);
  useEffect(() => { setDrawerOpen(false); setMenuOpen(false); pageFilters.close(); }, [pathname]);
  // Phones/tablets: pages with filters show a Filters button that opens a right-side drawer.
  const filters = usePageFilters();
  const hasFilters = filters.count > 0;
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  // Menu button: on desktop app pages it slides the left sidebar in/out (remembered; content then
  // takes the full width); everywhere else it opens/closes the drawer. Icon: X while open, bars while closed.
  // The html.sidebar-closed class drives the CSS in globals.css.
  function handleMenu() {
    if (togglesSidebar) {
      const closed = document.documentElement.classList.toggle('sidebar-closed');
      setSidebarClosed(closed);
      try { localStorage.setItem('sidebarClosed', closed ? '1' : '0'); } catch { /* storage blocked */ }
      return;
    }
    setDrawerOpen((o) => !o);
  }

  async function handleLogout() {
    try {
      await api.post('/auth/logout');
    } catch { /* still sign out locally */ }
    localStorage.removeItem('user');
    router.push('/');
    router.refresh();
  }

  return (
    <>
      {/* On phones the AI Tutor chat is full screen, so the bar is hidden there (desktop keeps it). */}
      <header className={`fixed inset-x-0 top-0 z-50 h-navbar bg-surface-50 shadow-card ${pathname === '/user/chat' ? 'hidden lg:block' : ''}`}>
        {/* Public pages (no sidebar): same 1280px container as the page content and footer.
            App pages keep the full-width Facebook-style bar. */}
        <div className={`flex h-full items-center justify-between gap-2 px-3 lg:px-4 ${hasSidebar ? '' : 'mx-auto w-full max-w-page'}`}>
          {/* Left: logo */}
          <div className="flex min-w-0 flex-1 items-center">
            <Logo href={homeFor(user)} />
          </div>

          {/* Centre: icon tabs (desktop) */}
          {user && (
            <nav className="hidden h-full items-stretch md:flex" aria-label="Main">
              {tabs.map(({ href, label, icon: Icon }) => {
                const active = isActivePath(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    title={label}
                    aria-label={label}
                    aria-current={active ? 'page' : undefined}
                    className="relative flex w-[60px] items-center justify-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand-500 lg:w-[96px]"
                  >
                    <span className={`flex h-12 w-full items-center justify-center rounded-lg transition-colors ${active ? 'text-brand-500' : 'text-surface-500 hover:bg-surface-100'}`}>
                      <Icon className="h-6 w-6" strokeWidth={active ? 2.4 : 2} />
                    </span>
                    {active && <span className="absolute inset-x-1 bottom-0 h-[3px] rounded-full bg-brand-500" />}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right: actions, menu button last */}
          <div className="flex flex-1 items-center justify-end gap-1.5 sm:gap-2">
            {user && !isAdmin && (
              <Link
                href="/user/wallet"
                title="AU balance"
                className="hidden h-10 items-center gap-1.5 rounded-full bg-surface-100 px-3 text-sm font-semibold text-surface-900 transition-colors hover:bg-surface-200 xs:flex"
              >
                <Coins className="h-4 w-4 text-accent-500" />
                {user.au} AU
              </Link>
            )}

            {hasFilters && (
              <button
                type="button"
                onClick={pageFilters.toggle}
                className={`${roundBtn} lg:hidden ${filters.open ? 'bg-brand-500/15 text-brand-600' : ''}`}
                aria-label="Search and filters"
                aria-expanded={filters.open}
                title="Search and filters"
              >
                <SlidersHorizontal className="h-5 w-5" />
              </button>
            )}
            <button type="button" onClick={toggleTheme} className={roundBtn} aria-label="Toggle theme" title="Toggle theme">
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-label="Account"
                  aria-expanded={menuOpen}
                  className="block rounded-full ring-offset-2 ring-offset-surface-50 transition hover:brightness-95"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatarFor(user)} alt={user.name} className="h-10 w-10 rounded-full bg-surface-100 object-cover" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-12 z-50 w-[300px] max-w-[calc(100vw-1rem)] rounded-lg bg-surface-50 p-2 shadow-menu animate-fade-in">
                    <Link href={profileHref} className="flex items-center gap-3 rounded-lg p-2 shadow-card transition-colors hover:bg-surface-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={avatarFor(user)} alt="" className="h-10 w-10 rounded-full bg-surface-100 object-cover" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-surface-900">{user.name}</p>
                        <p className="truncate text-xs text-surface-500">{user.email}</p>
                      </div>
                    </Link>
                    <div className="mt-2 space-y-0.5">
                      {items.filter((i) => !i.tab || i.href === profileHref).map(({ href, label, icon: Icon }) => (
                        <Link key={href} href={href} className="flex items-center gap-3 rounded-lg p-2 text-sm font-medium text-surface-900 transition-colors hover:bg-surface-100">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-100"><Icon className="h-5 w-5" /></span>
                          <span className="flex-1">{label}</span>
                          <ChevronRight className="h-5 w-5 text-surface-500" />
                        </Link>
                      ))}
                      <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg p-2 text-sm font-medium text-coral-600 transition-colors hover:bg-surface-100">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-coral-50"><LogOut className="h-5 w-5" /></span>
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden items-center gap-2 xs:flex">
                <Link href="/auth/login" className="flex h-10 items-center rounded-lg bg-surface-100 px-4 text-sm font-semibold text-surface-900 transition-colors hover:bg-surface-200">
                  Log in
                </Link>
                <Link href="/auth/signup" className="flex h-10 items-center rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white transition hover:brightness-110">
                  Sign up
                </Link>
              </div>
            )}

            {/* Menu button: always last at the right end; toggles the sidebar (desktop) or drawer (mobile) */}
            <button
              type="button"
              onClick={handleMenu}
              className={`${roundBtn} ${user ? '' : 'xs:hidden'}`}
              aria-label={menuShowsClose ? 'Close menu' : 'Open menu'}
              aria-expanded={menuShowsClose}
              title={menuShowsClose ? 'Close menu' : 'Open menu'}
            >
              {menuShowsClose ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Filters drawer (right, phones/tablets). Always mounted so pages can portal into the slot. */}
      <div className={`fixed inset-0 z-[100] lg:hidden ${filters.open && hasFilters ? 'visible' : 'invisible'}`} aria-hidden={!(filters.open && hasFilters)}>
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${filters.open ? 'opacity-100' : 'opacity-0'}`}
          onClick={pageFilters.close}
        />
        <aside
          role="dialog"
          aria-label="Search and filters"
          className={`absolute inset-y-0 right-0 flex w-[320px] max-w-[88vw] flex-col bg-surface-50 shadow-menu transition-transform duration-300 ease-out ${filters.open ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="flex h-navbar shrink-0 items-center justify-between border-b border-surface-200 px-3">
            <p className="flex items-center gap-2 text-lg font-bold text-surface-900">
              <SlidersHorizontal className="h-5 w-5 text-brand-500" /> Filters
            </p>
            <button type="button" onClick={pageFilters.close} className={roundBtn} aria-label="Close filters">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div ref={pageFilters.setSlot} className="flex-1 space-y-3 overflow-y-auto p-3" />
        </aside>
      </div>

      {/* Mobile drawer (left) */}
      <div className={`fixed inset-0 z-[100] ${drawerOpen ? 'visible' : 'invisible'}`} aria-hidden={!drawerOpen}>
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${drawerOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setDrawerOpen(false)}
        />
        <aside
          className={`absolute inset-y-0 left-0 flex w-[300px] max-w-[85vw] flex-col bg-surface-50 shadow-menu transition-transform duration-300 ease-out ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="flex h-navbar items-center justify-between border-b border-surface-200 px-3">
            <Logo href={homeFor(user)} onClick={() => setDrawerOpen(false)} />
            <button type="button" onClick={() => setDrawerOpen(false)} className={roundBtn} aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {user ? (
              <>
                <Link href={profileHref} className="mb-1 flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-surface-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatarFor(user)} alt="" className="h-9 w-9 rounded-full bg-surface-100 object-cover" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-surface-900">{user.name}</p>
                    <p className="truncate text-xs text-surface-500">{isAdmin ? 'System admin' : `Level ${user.level} · ${user.au} AU`}</p>
                  </div>
                </Link>
                {items.map(({ href, label, icon: Icon }) => {
                  const active = isActivePath(pathname, href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-3 rounded-lg p-2 text-[15px] font-medium transition-colors ${active ? 'bg-brand-500 text-white' : 'text-surface-900 hover:bg-surface-100'}`}
                    >
                      <span className={`flex h-9 w-9 items-center justify-center rounded-full ${active ? 'bg-white/20' : 'bg-surface-100'}`}><Icon className="h-5 w-5" /></span>
                      {label}
                    </Link>
                  );
                })}
              </>
            ) : (
              <div className="space-y-2 p-2">
                <Link href="/auth/login" className="flex h-11 items-center justify-center rounded-lg bg-surface-100 font-semibold text-surface-900">Log in</Link>
                <Link href="/auth/signup" className="flex h-11 items-center justify-center rounded-lg bg-brand-500 font-semibold text-white">Sign up</Link>
              </div>
            )}
          </div>

          {user && (
            <div className="border-t border-surface-200 p-2">
              <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg p-2 text-[15px] font-medium text-coral-600 transition-colors hover:bg-surface-100">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-coral-50"><LogOut className="h-5 w-5" /></span>
                Log out
              </button>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
