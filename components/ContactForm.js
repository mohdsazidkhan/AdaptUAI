'use client';

import { useEffect, useState } from 'react';
import { Send, CircleCheck, CircleAlert } from 'lucide-react';
import Button from './Button';

const field =
  'w-full rounded-lg border border-transparent bg-surface-100 px-4 text-[15px] text-surface-900 outline-none transition-colors placeholder:text-surface-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15';

const EMPTY = { name: '', email: '', subject: '', message: '', website: '' };

export default function ContactForm() {
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState(null); // 'success' | 'error'
  const [errorText, setErrorText] = useState('');
  const [loading, setLoading] = useState(false);

  // Signed-in users: fill name + email from the saved login.
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || 'null');
      if (u) setForm((f) => ({ ...f, name: f.name || u.name || '', email: f.email || u.email || '' }));
    } catch { /* storage unavailable */ }
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    setErrorText('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || 'Could not send your message. Please try again.');
      setStatus('success');
      setForm((f) => ({ ...EMPTY, name: f.name, email: f.email }));
    } catch (err) {
      setStatus('error');
      setErrorText(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className="mb-1 block text-sm font-semibold text-surface-900">Your name</label>
          <input id="c-name" required maxLength={100} autoComplete="name" value={form.name} onChange={set('name')} placeholder="e.g. Rahul Sharma" className={`${field} h-11`} />
        </div>
        <div>
          <label htmlFor="c-email" className="mb-1 block text-sm font-semibold text-surface-900">Email address</label>
          <input id="c-email" type="email" required maxLength={200} autoComplete="email" value={form.email} onChange={set('email')} placeholder="name@example.com" className={`${field} h-11`} />
        </div>
      </div>

      <div>
        <label htmlFor="c-subject" className="mb-1 block text-sm font-semibold text-surface-900">Subject</label>
        <input id="c-subject" required maxLength={200} value={form.subject} onChange={set('subject')} placeholder="How can we help?" className={`${field} h-11`} />
      </div>

      <div>
        <label htmlFor="c-message" className="mb-1 block text-sm font-semibold text-surface-900">Your message</label>
        <textarea id="c-message" required minLength={10} maxLength={5000} rows={6} value={form.message} onChange={set('message')} placeholder="Type your message here…" className={`${field} resize-none py-3`} />
      </div>

      {/* Honeypot for bots: hidden from people and screen readers */}
      <input type="text" name="website" value={form.website} onChange={set('website')} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

      {status === 'success' && (
        <div role="status" className="flex items-center gap-2 rounded-lg bg-brand-500/15 px-3 py-2.5 text-sm font-semibold text-brand-600 animate-slide-up">
          <CircleCheck className="h-5 w-5 shrink-0" /> Message sent! We usually reply within 24 hours.
        </div>
      )}
      {status === 'error' && (
        <div role="alert" className="flex items-center gap-2 rounded-lg bg-coral-50 px-3 py-2.5 text-sm font-semibold text-coral-600 animate-slide-up">
          <CircleAlert className="h-5 w-5 shrink-0" /> {errorText}
        </div>
      )}

      <Button type="submit" fullWidth size="lg" loading={loading}>
        {!loading && <Send className="h-4 w-4" />} {loading ? 'Sending…' : 'Send message'}
      </Button>
    </form>
  );
}
