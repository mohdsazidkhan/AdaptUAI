'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Receipt, Coins, Flame, Wallet } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { PageLoader } from '@/components/Loader';
import api from '@/lib/api';
import { PageHeader, SearchField, StatCard, Pill, brandBtn, fmtDateTime } from '@/components/admin/ui';
import DataView, { ViewToggle } from '@/components/admin/DataView';
import { useViewMode } from '@/components/admin/useAdminList';
import MobileFilters from '@/components/MobileFilters';

export default function TransactionsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [view, setView] = useViewMode('user-transactions');

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

  const statCards = (
    <>
      <StatCard icon={Coins} label="Balance" value={`${user?.au ?? 0} AU`} tone="accent" compact />
      <StatCard icon={Receipt} label="AU added" value={`${totals.added} AU`} compact />
      <StatCard icon={Flame} label="AU used" value={`${totals.spent} AU`} tone="coral" compact />
    </>
  );

  const columns = [
    {
      key: 'description', header: 'Description', primary: true,
      render: (t) => {
        const plus = t.type === 'RECHARGE';
        return (
          <div className="flex min-w-0 items-center gap-3">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${plus ? 'bg-brand-500/15 text-brand-600' : 'bg-coral-500/15 text-coral-600'}`}>
              {plus ? <Coins className="h-5 w-5" /> : <Flame className="h-5 w-5" />}
            </span>
            <p className="min-w-0 truncate font-semibold text-surface-900" title={t.description}>{t.description}</p>
          </div>
        );
      },
    },
    { key: 'type', header: 'Type', render: (t) => (t.type === 'RECHARGE' ? <Pill tone="brand">Recharge</Pill> : <Pill tone="coral">Spend</Pill>) },
    {
      key: 'amount', header: 'Amount',
      render: (t) => {
        const plus = t.type === 'RECHARGE';
        return <span className={`whitespace-nowrap font-semibold ${plus ? 'text-brand-600' : 'text-coral-600'}`}>{plus ? '+' : '−'}{t.amount} AU</span>;
      },
    },
    { key: 'date', header: 'Date', className: 'whitespace-nowrap text-surface-500', render: (t) => fmtDateTime(t.createdAt) },
  ];

  if (loading) return <PageLoader />;

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />

      <main className="flex-1 min-w-0 lg:ml-sidebar pt-navbar *:mx-auto *:w-full *:max-w-page *:p-3 lg:*:p-4 app-content">
        <div className="table-page self-padded animate-fade-in">
          {/* Phones/tablets: the totals sit at the top of the Filters drawer */}
          <MobileFilters title="Summary"><div className="grid grid-cols-1 gap-2">{statCards}</div></MobileFilters>
          <PageHeader
            title="Transaction History"
            count={transactions.length}
            search={<SearchField value={query} onChange={setQuery} placeholder="Search by description" label="Search transactions" />}
            filters={<ViewToggle view={view} onChange={setView} />}
            actions={<Link href="/user/wallet" className={brandBtn}><Wallet className="h-4 w-4" /> Wallet</Link>}
          />

          <div className="hidden grid-cols-3 gap-4 lg:grid">{statCards}</div>

          <section className="fb-card table-scroll">
            <DataView
              view={view}
              columns={columns}
              rows={shown}
              rowKey={(t) => t._id}
              empty={{ icon: Receipt, title: query ? 'No transactions match your search' : 'No transactions yet', text: query ? 'Try another word.' : 'Your AU spends and recharges will show here.' }}
            />
          </section>

          <section className="fb-card flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4">
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
