'use client';

import SideNav from './SideNav';
import { ADMIN_NAV } from '@/lib/navItems';

// Desktop admin rail. On phones the navbar menu drawer and the bottom nav carry the same links.
export default function AdminSidebar({ user }) {
  return (
    <SideNav user={user} items={ADMIN_NAV} profileHref="/admin/profile" subtitle="System admin">
      <p className="px-2 text-xs leading-relaxed text-surface-500">
        All services operational. Token use and streak tracking are active.
      </p>
    </SideNav>
  );
}
