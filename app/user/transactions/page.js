'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Card from '@/components/Card';
import { PageLoader } from '@/components/Loader';
import api from '@/lib/api';
import { format } from 'date-fns';

export default function TransactionsPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [userData, transData] = await Promise.all([
          api.get('/user/profile'),
          api.get('/user/transactions')
        ]);

        setData({
          user: userData.user,
          transactions: transData.transactions
        });
      } catch (err) {
        console.error('Failed to fetch transactions:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <PageLoader />;

  const { user, transactions } = data || { transactions: [] };

  return (
    <div className="flex bg-surface-50 min-h-screen">
      <Sidebar user={user} />

      <main className="flex-1 lg:ml-64 pt-24 pb-12 px-4 sm:px-6 lg:px-8 container mx-auto">
        <div className="animate-fade-in">
          <header className="mb-8">
            <h1 className="text-xl lg:text-3xl font-black text-surface-900 dark:text-white flex items-center gap-3">
              <span>📜</span> Transaction History
            </h1>
            <p className="text-surface-500 font-semibold mt-1">
              Track your AU token usage and recharges.
            </p>
          </header>

          <Card padding="none" className="overflow-hidden border-b-4 border-brand-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-100/50 border-b border-surface-200">
                    <th className="px-0 lg:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-surface-400">Type</th>
                    <th className="px-0 lg:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-surface-400">Description</th>
                    <th className="px-0 lg:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-surface-400">Date</th>
                    <th className="px-0 lg:px-6 py-4 text-[10px] font-black uppercase tracking-widest text-surface-400 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {transactions.length > 0 ? (
                    transactions.map((t) => (
                      <tr key={t._id} className="hover:bg-surface-50 transition-colors group">
                        <td className="px-0 lg:px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight ${t.type === 'RECHARGE'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-coral-50 text-coral-600'
                            }`}>
                            {t.type === 'RECHARGE' ? '⚡ Recharge' : '🪙 Spend'}
                          </span>
                        </td>
                        <td className="px-0 lg:px-6 py-4">
                          <p className="text-sm font-bold text-surface-800">{t.description}</p>
                        </td>
                        <td className="px-0 lg:px-6 py-4 whitespace-nowrap">
                          <p className="text-xs font-semibold text-surface-400">
                            {format(new Date(t.createdAt), 'MMM dd, yyyy • HH:mm')}
                          </p>
                        </td>
                        <td className="px-0 lg:px-6 py-4 text-right whitespace-nowrap">
                          <span className={`text-sm font-black ${t.type === 'RECHARGE' ? 'text-green-600' : 'text-surface-900'
                            }`}>
                            {t.type === 'RECHARGE' ? '+' : '-'}{t.amount} AU
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2 opacity-40">
                          <span className="text-4xl">🕳️</span>
                          <p className="text-sm font-bold">No transactions found yet.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <footer className="mt-8 text-center p-6 bg-brand-50 rounded-xl border border-brand-100">
            <p className="text-xs font-bold text-brand-900 mb-1">Need to top up your wallet?</p>
            <p className="text-[10px] text-brand-600">
              Contact support at <span className="font-black underline underline-offset-2">{process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'support@mohdsazidkhan.com'}</span>
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
