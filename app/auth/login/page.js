'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/Button';
import AuthShell, { authInput } from '@/components/AuthShell';
import { PageLoader } from '@/components/Loader';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || null;

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      const destination = data.user?.redirect || callbackUrl || '/user/dashboard';
      router.push(destination);
      router.refresh();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={'Log in to AdaptUAI'}
      subtitle={'Continue your learning journey'}
    >
      {error && (
        <div className="mb-3 rounded-lg bg-coral-50 px-3 py-2.5 text-sm font-medium text-coral-600 animate-slide-up">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="sr-only" htmlFor="email">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email address"
              className={authInput}
            />
          </div>
          <div>
            <label className="sr-only" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              className={authInput}
            />
          </div>
        <Button type="submit" fullWidth size="lg" loading={loading}>
          Log in
        </Button>
      </form>

      <div className="my-4 border-t border-surface-200" />

      <div className="flex justify-center">
        <Link href="/auth/signup" className="inline-flex h-11 items-center rounded-lg bg-surface-900 px-5 text-[15px] font-semibold text-surface-50 transition hover:opacity-90">
          Create new account
        </Link>
      </div>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <LoginContent />
    </Suspense>
  );
}
