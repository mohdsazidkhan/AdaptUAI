'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Card from '@/components/Card';
import { PageLoader } from '@/components/Loader';
import api from '@/lib/api';

export default function WalletPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await api.get('/user/profile');
        setData(data.user);
      } catch (err) {
        console.error('Failed to fetch wallet data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="flex bg-surface-50 min-h-screen">
      <Sidebar user={data} />

      <main className="flex-1 pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="animate-fade-in">
          <header className="mb-8">
            <h1 className="text-3xl font-black text-surface-900">AU Token Wallet</h1>
            <p className="text-surface-500 font-semibold mt-1">
              Manage your tokens and recharge for more learning
            </p>
          </header>

          <div className="space-y-6">
            <Card padding="lg" className="border-brand-100 bg-brand-50/10 shadow-glow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-surface-900 flex items-center gap-2">
                    <span>🪙</span> Current Balance
                  </h3>
                  <p className="text-xs text-surface-400 font-bold uppercase tracking-wider mt-1">
                    Ready for your next AI sessions
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="px-6 py-3 bg-brand-500 text-white rounded-2xl shadow-lg shadow-brand-500/20 transform hover:scale-105 transition-transform">
                    <span className="text-2xl font-black">{data?.au}</span>
                    <span className="ml-2 text-xs font-bold uppercase">AU Tokens</span>
                  </div>
                  <Link href="/transactions" className="text-[10px] font-black uppercase text-brand-600 hover:text-brand-700 hover:underline tracking-widest flex items-center gap-1">
                    <span>📜</span> View Transaction History
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-surface-100 border border-surface-200 shadow-sm">
                  <p className="text-[10px] text-surface-400 font-black uppercase mb-1 tracking-widest">Consumption Rate</p>
                  <p className="text-lg font-black text-surface-800">
                    -{process.env.NEXT_PUBLIC_EACH_CHAT_AU_TOKEN || 10} AU <span className="text-xs font-bold text-surface-400">/ message</span>
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-surface-100 border border-surface-200 shadow-sm">
                  <p className="text-[10px] text-surface-400 font-black uppercase mb-1 tracking-widest">Pricing Plan</p>
                  <p className="text-lg font-black text-brand-600">
                    ₹1 = {(Number(process.env.NEXT_PUBLIC_AU_PER_RUPEE) || 10)} AU Tokens
                  </p>
                  <p className="text-[10px] text-coral-500 font-black mt-1 uppercase tracking-widest border-t border-surface-100 pt-2">
                    Min Recharge: ₹{process.env.NEXT_PUBLIC_MINIMUM_RECHARGE || 100}
                  </p>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl bg-surface-50 border border-surface-200 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-500 mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-black text-surface-900 mb-1">Email Support</h4>
                <p className="text-sm text-surface-500 mb-6 px-4">Professional support for bulk recharges and business inquiries.</p>
                <a 
                  href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'support@mohdsazidkhan.com'}`}
                  className="w-full py-3 bg-surface-100 hover:bg-surface-200 rounded-xl text-sm font-black text-surface-700 transition-colors"
                >
                  {process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'support@mohdsazidkhan.com'}
                </a>
              </div>

              <a 
                href={`https://wa.me/${(process.env.NEXT_PUBLIC_WHATSAPP_CONTACT || '+917678131912').replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-6 rounded-3xl bg-surface-50 border border-[#25D366]/30 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow group"
              >
                <div className="w-16 h-16 bg-[#25D366]/10 rounded-2xl flex items-center justify-center text-[#25D366] mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
                <h4 className="text-lg font-black text-[#128C7E] mb-1">WhatsApp Now</h4>
                <p className="text-sm text-surface-500 mb-6 px-4">The fastest way to recharge your account 24/7.</p>
                <div className="w-full py-3 bg-[#25D366] text-white rounded-xl text-sm font-black shadow-lg shadow-[#25D366]/20">
                  Message Support
                </div>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
