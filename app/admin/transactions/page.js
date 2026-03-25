'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/Card';
import { PageLoader } from '@/components/Loader';
import api from '@/lib/api';

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [stats, setStats] = useState({ totalSpent: 0, totalRecharged: 0 });
  const [loading, setLoading] = useState(true);

  async function fetchTransactions(page = 1) {
    setLoading(true);
    try {
      const response = await api.get(`/admin/transactions?page=${page}&limit=50`);
      setTransactions(response.transactions);
      setPagination(response.pagination);
      setStats(response.stats || { totalSpent: 0, totalRecharged: 0 });
    } catch (err) {
      console.error('Failed to fetch admin transactions:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTransactions();
  }, []);

  if (loading && transactions.length === 0) return <PageLoader />;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-surface-100 dark:border-surface-100/10 pb-8">
        <div>
          <h1 className="text-3xl font-black text-surface-900 dark:text-white flex items-center gap-3">
            <span className="p-2 bg-coral-500 text-white rounded-xl text-xl shadow-lg shadow-coral-500/20">📜</span>
            Transaction Ledger
          </h1>
          <p className="text-surface-500 font-bold mt-2 ml-1">Global audit of all system AU token movement</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 md:gap-8 bg-surface-50 dark:bg-surface-50 border border-surface-200 dark:border-surface-100/10 p-4 rounded-2xl shadow-sm">
          <div className="min-w-[100px]">
            <p className="text-[10px] font-black text-surface-400 dark:text-surface-500 uppercase tracking-widest mb-1 leading-none">Total Records</p>
            <p className="text-xl font-black text-surface-900 dark:text-white leading-none">{pagination.total}</p>
          </div>
          <div className="hidden md:block h-8 w-px bg-surface-200 dark:bg-surface-100/10" />
          <div className="min-w-[100px]">
            <p className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1 leading-none">Total AU Tokens</p>
            <p className="text-xl font-black text-purple-900 dark:text-purple-100 leading-none">{stats.totalRecharged}</p>
          </div>
          <div className="hidden md:block h-8 w-px bg-surface-200 dark:bg-surface-100/10" />
          <div className="min-w-[100px]">
            <p className="text-[10px] font-black text-coral-600 dark:text-coral-400 uppercase tracking-widest mb-1 leading-none">Total AU Used</p>
            <p className="text-xl font-black text-coral-900 dark:text-coral-100 leading-none">{stats.totalSpent}</p>
          </div>
          <div className="hidden md:block h-8 w-px bg-surface-200 dark:bg-surface-100/10" />
          <div className="min-w-[100px]">
            <p className="text-[10px] font-black text-accent-600 dark:text-accent-400 uppercase tracking-widest mb-1 leading-none">Total AU Left</p>
            <p className="text-xl font-black text-accent-900 dark:text-accent-100 leading-none">{stats.totalLeft}</p>
          </div>
        </div>
      </header>

      <Card padding="none" className="overflow-hidden border-surface-200">
        <div className="overflow-x-auto">
          {/* Table content as before... */}
          <table className="w-full text-left">
            {/* Headers as before */}
            <thead className="bg-surface-50 dark:bg-surface-100/50 border-b border-surface-200 dark:border-surface-800">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-surface-400 uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-xs font-black text-surface-400 uppercase tracking-widest">Type</th>
                <th className="px-6 py-4 text-xs font-black text-surface-400 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-xs font-black text-surface-400 uppercase tracking-widest">Description</th>
                <th className="px-6 py-4 text-xs font-black text-surface-400 uppercase tracking-widest">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {transactions.map((t) => (
                <tr key={t._id} className="hover:bg-surface-50 dark:hover:bg-surface-100/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-bold text-surface-900 dark:text-white">{t.userId?.name || 'Unknown'}</p>
                      <p className="text-[10px] text-surface-400 dark:text-surface-500">{t.userId?.email || 'N/A'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      t.type === 'RECHARGE' 
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20' 
                        : 'bg-coral-50 dark:bg-coral-900/20 text-coral-600 dark:text-coral-400 border border-coral-200 dark:border-coral-500/20'
                    }`}>
                      {t.type === 'RECHARGE' ? '⚡ Recharge' : '🪙 Spend'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-black text-sm">
                    {t.type === 'RECHARGE' ? '+' : '-'}{t.amount} AU
                  </td>
                  <td className="px-6 py-4 text-sm text-surface-500 max-w-xs truncate">
                    {t.description}
                  </td>
                  <td className="px-6 py-4 text-xs text-surface-400">
                    {new Date(t.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination Controls */}
      {pagination.pages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-surface-500">
            Showing <span className="font-bold">{(pagination.page - 1) * 50 + 1}</span> to <span className="font-bold">{Math.min(pagination.page * 50, pagination.total)}</span> of <span className="font-bold">{pagination.total}</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => fetchTransactions(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-4 py-2 bg-surface-100 hover:bg-surface-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-bold transition-all"
            >
              Previous
            </button>
            <button
              onClick={() => fetchTransactions(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="px-4 py-2 bg-surface-100 hover:bg-surface-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-bold transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
