'use client';

import { useEffect, useState } from 'react';
import { Coins, X, Check } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/lib/api';
import { avatarFor } from '@/lib/navItems';
import { IconButton, greyBtn, brandBtn } from './ui';

const AU_PER_RUPEE = Number(process.env.NEXT_PUBLIC_AU_PER_RUPEE) || 10;
const MIN_RECHARGE = Number(process.env.NEXT_PUBLIC_MINIMUM_RECHARGE) || 0;

const field =
  'h-11 w-full rounded-lg border border-transparent bg-surface-100 px-3 text-[15px] text-surface-900 outline-none placeholder:text-surface-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15';

/**
 * Credit AU to a learner after the admin has received their payment (e.g. UPI).
 * Typing rupees fills AU automatically (₹1 = AU_PER_RUPEE AU) until AU is edited by hand.
 * onDone(newBalance) is called after a successful recharge.
 */
export default function RechargeModal({ user, onClose, onDone }) {
  const [rupees, setRupees] = useState('');
  const [au, setAu] = useState('');
  const [auTouched, setAuTouched] = useState(false);
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !saving) onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, saving]);

  const onRupees = (v) => {
    setRupees(v);
    if (!auTouched) setAu(v === '' ? '' : String(Math.round(Number(v) * AU_PER_RUPEE)));
  };

  const auNum = parseInt(au, 10);
  const valid = Number.isInteger(auNum) && auNum > 0;
  const belowMin = rupees !== '' && MIN_RECHARGE > 0 && Number(rupees) < MIN_RECHARGE;

  const submit = async (e) => {
    e.preventDefault();
    if (!valid || saving) return;
    setSaving(true);
    setError('');
    try {
      const res = await api.post('/admin/users/recharge', {
        userId: user._id,
        au: auNum,
        rupees: rupees === '' ? null : Number(rupees),
        reference,
        note,
      });
      toast.success(`${auNum} AU added to ${user.name}. New balance: ${res.au} AU`);
      onDone(res.au);
    } catch (err) {
      setError(err.message || 'Recharge failed. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={`Recharge AU for ${user.name}`}>
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={() => !saving && onClose()} />
      <form onSubmit={submit} className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-xl bg-surface-50 shadow-menu animate-slide-up sm:rounded-lg">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-surface-200 bg-surface-50 px-4 py-3">
          <h2 className="text-lg font-bold text-surface-900">Recharge <span className="text-brand-500">AU</span></h2>
          <IconButton icon={X} label="Close" onClick={onClose} disabled={saving} />
        </div>

        <div className="space-y-3 p-4">
          <div className="flex items-center gap-3 rounded-lg bg-surface-100 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarFor(user)} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-surface-900">{user.name}</p>
              <p className="truncate text-xs text-surface-500">{user.email}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-surface-500">Balance</p>
              <p className="font-bold text-surface-900">{user.au ?? 0} AU</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="rc-rupees" className="mb-1 block text-sm font-semibold text-surface-900">Amount paid (₹)</label>
              <input id="rc-rupees" type="number" min={0} step="1" inputMode="numeric" autoFocus value={rupees} onChange={(e) => onRupees(e.target.value)} placeholder="e.g. 100" className={field} />
            </div>
            <div>
              <label htmlFor="rc-au" className="mb-1 block text-sm font-semibold text-surface-900">AU to add</label>
              <input id="rc-au" type="number" min={1} step="1" inputMode="numeric" required value={au} onChange={(e) => { setAu(e.target.value); setAuTouched(true); }} placeholder={`₹1 = ${AU_PER_RUPEE} AU`} className={field} />
            </div>
          </div>
          <p className="text-xs text-surface-500">
            ₹1 = {AU_PER_RUPEE} AU{MIN_RECHARGE ? ` · minimum recharge ₹${MIN_RECHARGE}` : ''}
            {belowMin && <span className="font-semibold text-accent-600"> · below the minimum</span>}
          </p>

          <div>
            <label htmlFor="rc-ref" className="mb-1 block text-sm font-semibold text-surface-900">UPI reference / transaction ID</label>
            <input id="rc-ref" value={reference} onChange={(e) => setReference(e.target.value)} maxLength={100} placeholder="e.g. 431298765432" className={field} />
            <p className="mt-1 text-xs text-surface-500">Saved with the recharge. The same reference cannot be credited twice.</p>
          </div>

          <div>
            <label htmlFor="rc-note" className="mb-1 block text-sm font-semibold text-surface-900">Note <span className="font-normal text-surface-500">(optional)</span></label>
            <input id="rc-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={120} placeholder="e.g. Paid via PhonePe" className={field} />
          </div>

          {valid && (
            <div className="flex items-center justify-between rounded-lg bg-brand-500/15 px-3 py-2.5 text-sm">
              <span className="flex items-center gap-1.5 font-semibold text-brand-600"><Coins className="h-4 w-4" /> New balance</span>
              <span className="font-bold text-surface-900">{(user.au ?? 0) + auNum} AU</span>
            </div>
          )}

          {error && <p role="alert" className="rounded-lg bg-coral-500/15 px-3 py-2.5 text-sm font-semibold text-coral-600">{error}</p>}

          <div className="flex justify-end gap-2 border-t border-surface-200 pt-3">
            <button type="button" onClick={onClose} disabled={saving} className={greyBtn}>Cancel</button>
            <button type="submit" disabled={!valid || saving} className={brandBtn}>
              <Check className="h-4 w-4" /> {saving ? 'Adding…' : valid ? `Add ${auNum} AU` : 'Add AU'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
