'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import api from '@/lib/api';

export default function AdminLayout({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        const role = storedUser?.role || 'user';
        const endpoint = role === 'admin' ? '/admin/profile' : '/user/profile';
        const data = await api.get(endpoint);
        setUser(data.user);
      } catch (err) {
        console.error('AdminLayout: Failed to fetch user:', err);
      }
    }
    fetchUser();
  }, []);

  return (
    <div className="min-h-screen">
      <AdminSidebar user={user} />
      <main className="min-w-0 pt-navbar lg:ml-sidebar">
        <div className="app-content mx-auto w-full max-w-page p-3 lg:p-4">
          {children}
        </div>
      </main>
    </div>
  );
}
