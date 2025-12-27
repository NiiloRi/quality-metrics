'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { ArrowLeft, User, Lock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid username or password');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Back link */}
      <div className="p-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>

      {/* Login card */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="card-professional p-8">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <Logo size="lg" showText={false} />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-[var(--foreground)] font-heading mb-2 text-center">
              Welcome Back
            </h1>
            <p className="text-[var(--foreground-secondary)] mb-8 text-center">
              Sign in to access Quality Metrics
            </p>

            {/* Error message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-[var(--foreground-muted)] mb-2">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--foreground-muted)]" />
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                    placeholder="Enter your username"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[var(--foreground-muted)] mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--foreground-muted)]" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors"
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Info */}
            <div className="mt-8 p-4 bg-[var(--background-secondary)] rounded-xl">
              <p className="text-sm text-[var(--foreground-muted)] text-center">
                Contact your administrator if you need access credentials.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
