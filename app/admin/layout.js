import { useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="bg-surface-50 dark:bg-background min-h-screen">
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-surface-900 text-white sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-xl">🦉</span>
          <span className="font-black tracking-tight">Admin Console</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 hover:bg-surface-800 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
      </div>

      <div className="flex">
        <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        
        <main className="flex-1 lg:ml-64 min-h-screen transition-all duration-300 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
