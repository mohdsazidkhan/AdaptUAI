'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Card from '@/components/Card';

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
    <div className="min-h-screen bg-hero pt-32 pb-20 px-4 flex items-center justify-center transition-colors duration-500">
      <Card className="w-full max-w-md shadow-2xl animate-fade-in" padding="lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block text-4xl mb-4 animate-float">🦉</Link>
          <h1 className="text-xl lg:text-3xl font-black text-surface-900 dark:text-white">Get Started!</h1>
          <p className="text-surface-500 font-medium">Join AdaptUAI today and start learning smarter</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-coral-50 border border-coral-200 text-coral-700 text-sm font-bold rounded-xl animate-slide-up">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-surface-700 mb-2 px-1" htmlFor="name">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              className="w-full px-4 py-3 bg-surface-50 border-2 border-surface-200 rounded-xl focus:border-brand-500 focus:outline-none transition-all font-medium text-surface-900"
            />
          </div>

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
              Sign Up Free
            </Button>
          </div>
        </form>

        <div className="mt-8 text-center text-xs text-surface-400 font-medium">
          By signing up, you agree to our <span className="underline cursor-pointer">Terms</span> and <span className="underline cursor-pointer">Privacy Policy</span>
        </div>

        <div className="mt-8 text-center">
          <p className="text-surface-500 font-medium">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-brand-600 font-bold hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
