'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import AuthShell, { authInput } from '@/components/AuthShell';

export default function SignupPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
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
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      router.push('/user/dashboard');
      router.refresh();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={'Create a new account'}
      subtitle={'It’s quick and free to start'}
    >
      {error && (
        <div className="mb-3 rounded-lg bg-coral-50 px-3 py-2.5 text-sm font-medium text-coral-600 animate-slide-up">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="sr-only" htmlFor="name">Full name</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Full name"
              className={authInput}
            />
          </div>
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
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              placeholder="New password"
              className={authInput}
            />
          </div>
        <Button type="submit" fullWidth size="lg" loading={loading}>
          Sign up
        </Button>
      </form>

      <div className="my-4 border-t border-surface-200" />

      <p className="text-center text-sm text-surface-500">
        Already have an account?{' '}
        <Link href="/auth/login" className="font-semibold text-brand-600 hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
