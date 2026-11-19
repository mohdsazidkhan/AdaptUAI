'use client';

import { ArrowLeftRight, Coins, Flame, Wallet, Receipt, RefreshCw } from 'lucide-react';
import { avatarFor } from '@/lib/navItems';
import { PageHeader, SearchField, StatCard, Pill, IconButton, fmtDateTime } from '@/components/admin/ui';
import DataView, { SelectField, ViewToggle, Pagination } from '@/components/admin/DataView';
import { useAdminList, useViewMode } from '@/components/admin/useAdminList';

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'amount_high', label: 'Amount high–low' },
  { value: 'amount_low', label: 'Amount low–high' },
];
const TYPES = [
  { value: 'all', label: 'All' },
  { value: 'SPEND', label: 'Spend' },
  { value: 'RECHARGE', label: 'Recharge' },
];
const RANGES = [
  { value: 'all', label: 'Any time' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
];

const TypePill = ({ type }) => (type === 'RECHARGE' ? <Pill tone="brand">Recharge</Pill> : <Pill tone="coral">Spend</Pill>);
const Amount = ({ t }) => {
  const plus = t.type === 'RECHARGE';
  return <span className={`whitespace-nowrap font-semibold ${plus ? 'text-brand-600' : 'text-coral-600'}`}>{plus ? '+' : '−'}{t.amount} AU</span>;
};

export default function AdminTransactions() {
  const list = useAdminList('/admin/transactions', { sort: 'newest', type: 'all', range: 'all' });
  const [view, setView] = useViewMode('admin-transactions');
  const transactions = list.data?.transactions || [];
  const stats = list.data?.stats || {};
  const total = list.data?.pagination?.total ?? 0;
  const v = (n) => (list.data ? n ?? 0 : '…');

  const columns = [
    {
      key: 'user', header: 'User', primary: true,
      render: (t) => (
        <div className="flex min-w-0 items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatarFor(t.userId)} alt="" className="h-10 w-10 shrink-0 rounded-full bg-surface-100 object-cover" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-surface-900">{t.userId?.name || 'Unknown'}</p>
            <p className="truncate text-xs text-surface-500">{t.userId?.email || 'N/A'}</p>
          </div>
        </div>
      ),
    },
    { key: 'type', header: 'Type', render: (t) => <TypePill type={t.type} /> },
    { key: 'amount', header: 'Amount', render: (t) => <Amount t={t} /> },
    { key: 'description', header: 'Description', className: 'max-w-xs', render: (t) => <span className="block truncate text-surface-500" title={t.description}>{t.description}</span> },
    { key: 'date', header: 'Date', className: 'whitespace-nowrap text-surface-500', render: (t) => fmtDateTime(t.createdAt) },
  ];

  return (
    <div className="table-page">
      <PageHeader
        title="Transactions"
        count={total}
        search={<SearchField value={list.searchInput} onChange={list.setSearchInput} placeholder="Search name, email or description" label="Search transactions" />}
        filters={<>
        <SelectField label="Type" value={list.params.type} onChange={(val) => list.set({ type: val })} options={TYPES} />
        <SelectField label="Date" value={list.params.range} onChange={(val) => list.set({ range: val })} options={RANGES} />
          <SelectField label="Sort" value={list.params.sort} onChange={(val) => list.set({ sort: val })} options={SORTS} /><ViewToggle view={view} onChange={setView} />
        </>}
        actions={<IconButton icon={RefreshCw} label="Refresh" onClick={list.reload} />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard icon={Receipt} label="Records found" value={v(total)} tone="grey" />
        <StatCard icon={Coins} label="Total AU issued" value={v(stats.totalRecharged)} />
        <StatCard icon={Flame} label="Total AU used" value={v(stats.totalSpent)} tone="coral" />
        <StatCard icon={Wallet} label="AU left with users" value={v(stats.totalLeft)} tone="accent" />
      </div>


      <section className="fb-card table-scroll">
        <DataView
          view={view}
          columns={columns}
          rows={transactions}
          rowKey={(t) => t._id}
          loading={list.loading}
          empty={{ icon: ArrowLeftRight, title: list.params.search ? 'No transactions match your search' : 'No transactions found', text: 'Try changing the filters.' }}
        />
      </section>

      <Pagination pagination={list.data?.pagination} onPage={(p) => list.set({ page: p })} onLimit={(l) => list.set({ limit: l })} />
    </div>
  );
}
