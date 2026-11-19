import { Home, Bot, MessagesSquare, Wallet, Receipt, UserRound, LayoutDashboard, Users, ArrowLeftRight, Mail } from 'lucide-react';

// One list of links for the navbar tabs, left sidebar, mobile drawer and bottom nav.
// Every item shows in the left sidebar AND as a navbar centre icon (same list, same order) and in the mobile bottom nav.
export const USER_NAV = [
  { href: '/user/dashboard', label: 'Home', icon: Home, tab: true },
  { href: '/user/chat', label: 'AI Tutor', icon: Bot, tab: true },
  { href: '/user/chats', label: 'Sessions', icon: MessagesSquare, tab: true },
  { href: '/user/wallet', label: 'Wallet', icon: Wallet, tab: true },
  { href: '/user/transactions', label: 'History', icon: Receipt, tab: true },
  { href: '/user/profile', label: 'Profile', icon: UserRound, tab: true },
];

export const ADMIN_NAV = [
  { href: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard, tab: true },
  { href: '/admin/users', label: 'Users', icon: Users, tab: true },
  { href: '/admin/chats', label: 'Users Chat', icon: MessagesSquare, tab: true },
  { href: '/admin/transactions', label: 'Transactions', icon: ArrowLeftRight, tab: true },
  { href: '/admin/contacts', label: 'Contacts', icon: Mail, tab: true },
  { href: '/admin/profile', label: 'My Profile', icon: UserRound, tab: true },
];

export const navFor = (user) => (user?.role === 'admin' ? ADMIN_NAV : USER_NAV);

export const homeFor = (user) => (!user ? '/' : user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard');

export const isActivePath = (pathname, href) => pathname === href || pathname?.startsWith(`${href}/`);

export const avatarFor = (user) =>
  user?.avatarUrl || `https://api.dicebear.com/8.x/fun-emoji/svg?seed=${encodeURIComponent(user?.name || 'user')}`;
