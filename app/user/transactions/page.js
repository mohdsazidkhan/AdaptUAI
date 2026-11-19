'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Receipt, Coins, Flame, Wallet } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { PageLoader } from '@/components/Loader';
import api from '@/lib/api';
import { PageHeader, SearchField, StatCard, Pill, EmptyState, card, brandBtn, fmtDateTime } from '@/components/admin/ui';

export default function TransactionsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [userData, transData] = await Promise.all([api.get('/user/profile'), api.get('/user/transactions')]);
        setData({ user: userData.user, transactions: transData.transactions || [] });
      } catch (err) {
        console.error('Failed to fetch transactions:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const { user, transactions } = data || { transactions: [] };

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? transactions.filter((t) => [t.description, t.type].some((v) => v?.toLowerCase().includes(q))) : transactions;
  }, [transactions, query]);

  const totals = useMemo(() => transactions.reduce(
    (acc, t) => (t.type === 'RECHARGE' ? { ...acc, added: acc.added + t.amount } : { ...acc, spent: acc.spent + t.amount }),
    { added: 0, spent: 0 }
  ), [transactions]);

  if (loading) return <PageLoader />;

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />

      <main className="flex-1 min-w-0 lg:ml-sidebar pt-navbar *:mx-auto *:w-full *:max-w-page *:p-3 lg:*:p-4 app-content">
        <div className="table-page self-padded animate-fade-in">
          <PageHeader
            title="Transaction History"
            count={transactions.length}
            search={<SearchField value={query} onChange={setQuery} placeholder="Search by description" label="Search transactions" />}
            actions={<Link href="/user/wallet" className={brandBtn}><Wallet className="h-4 w-4" /> Wallet</Link>}
          />

          <div className="grid gap-3 sm:grid-cols-3 lg:gap-4">
            <StatCard icon={Coins} label="Current balance" value={`${user?.au ?? 0} AU`} tone="accent" />
            <StatCard icon={Receipt} label="AU added" value={`${totals.added} AU`} />
            <StatCard icon={Flame} label="AU used" value={`${totals.spent} AU`} tone="coral" />
          </div>

          <section className={`${card} table-scroll`}>
            {shown.length === 0 ? (
              <EmptyState icon={Receipt} title={query ? 'No transactions match your search' : 'No transactions yet'} text={query ? 'Try another word.' : 'Your AU spends and recharges will show here.'} />
            ) : (
              <ul className="divide-y divide-surface-200">
                {shown.map((t) => {
                  const plus = t.type === 'RECHARGE';
                  return (
                    <li key={t._id} className="flex items-center gap-3 p-3 sm:p-4">
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${plus ? 'bg-brand-500/15 text-brand-600' : 'bg-coral-500/15 text-coral-600'}`}>
                        {plus ? <Coins className="h-5 w-5" /> : <Flame className="h-5 w-5" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-semibold text-surface-900">{t.description}</p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                          <Pill tone={plus ? 'brand' : 'coral'}>{plus ? 'Recharge' : 'Spend'}</Pill>
                          <span className="text-xs text-surface-500">{fmtDateTime(t.createdAt)}</span>
                        </div>
                      </div>
                      <span className={`shrink-0 font-semibold ${plus ? 'text-brand-600' : 'text-coral-600'}`}>{plus ? '+' : '−'}{t.amount} AU</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className={`${card} flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4`}>
            <div>
              <p className="font-semibold text-surface-900">Need to top up your wallet?</p>
              <p className="text-sm text-surface-500">Contact support and we will recharge your AU.</p>
            </div>
            <Link href="/contact" className={brandBtn}>Contact support</Link>
          </section>
        </div>
      </main>
    </div>
  );
}
