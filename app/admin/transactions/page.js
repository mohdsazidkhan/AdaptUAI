'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/Card';
import { PageLoader } from '@/components/Loader';
import api from '@/lib/api';

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const response = await api.get('/admin/transactions');
        setTransactions(response.transactions);
      } catch (err) {
        console.error('Failed to fetch admin transactions:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTransactions();
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-surface-900">Transaction History</h1>
        <p className="text-surface-500 font-bold mt-2">Global log of all AU token credits and debits</p>
      </header>

      <Card padding="none" className="overflow-hidden border-surface-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-50 border-b border-surface-200">
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
                <tr key={t._id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-bold text-surface-900">{t.userId?.name || 'Unknown'}</p>
                      <p className="text-[10px] text-surface-400">{t.userId?.email || 'N/A'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      t.type === 'RECHARGE' ? 'bg-green-100 text-green-700' : 'bg-coral-50 text-coral-600'
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
    </div>
  );
}
