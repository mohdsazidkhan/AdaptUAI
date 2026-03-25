'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import api from '@/lib/api';

export default function AdminLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        // Get user role from localStorage
        const storedUser = JSON.parse(localStorage.getItem('user'));
        const role = storedUser?.role || 'user';
        
        // Call API based on role
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
    <div className="bg-surface-50 dark:bg-background min-h-screen">
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between py-2 px-4 bg-surface-900 border-b border-surface-800 text-white sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-xl">🛡️</span>
          <span className="font-black tracking-tight tracking-tighter">Admin Console</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 hover:bg-surface-800 rounded-lg transition-colors border border-surface-800"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
      </div>

      <div className="flex">
        <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} user={user} />

        <main className="flex-1 ml-0 lg:ml-64 pt-0 lg:pt-16 min-h-screen transition-all duration-300 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
