'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/Button';
import Card from '@/components/Card';
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

      const destination = data.user?.redirect || callbackUrl || '/user/dashboard';
      router.push(destination);
      router.refresh();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero pt-32 pb-20 px-4 flex items-center justify-center transition-colors">
      <Card className="w-full max-w-md shadow-2xl animate-fade-in" padding="lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block text-4xl mb-4 animate-float">🦉</Link>
          <h1 className="text-3xl font-black text-surface-900 dark:text-white">Welcome Back!</h1>
          <p className="text-surface-500 font-medium">Log in to continue your learning journey</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-coral-50 border border-coral-200 text-coral-700 text-sm font-bold rounded-xl animate-slide-up">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-surface-700 mb-2 px-1" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="name@example.com"
              className="w-full px-4 py-3 bg-surface-50 border-2 border-surface-200 rounded-xl focus:border-brand-500 focus:outline-none transition-all font-medium text-surface-900"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-surface-700 mb-2 px-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-surface-50 border-2 border-surface-200 rounded-xl focus:border-brand-500 focus:outline-none transition-all font-medium text-surface-900"
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
              className="text-lg"
            >
              Log In
            </Button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <p className="text-surface-500 font-medium">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-brand-600 font-bold hover:underline">
              Sign up free
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <LoginContent />
    </Suspense>
  );
}
