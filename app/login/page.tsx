'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/user-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useUser();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard/overview');
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-8">
          <div className="mb-8 text-center">
            <div className="mb-4 text-5xl">🅿️</div>
            <h1 className="text-2xl font-bold text-slate-100">ParkSight AI</h1>
            <p className="mt-2 text-slate-400">Parking Violation Intelligence</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 bg-slate-800 text-slate-100"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 bg-slate-800 text-slate-100"
                placeholder="password"
              />
            </div>

            {error && <div className="rounded bg-red-900/20 p-3 text-sm text-red-400">{error}</div>}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 border-t border-slate-800 pt-6">
            <p className="text-center text-sm text-slate-400">Demo Credentials:</p>
            <div className="mt-3 space-y-2 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>Admin:</span>
                <span>admin@example.com</span>
              </div>
              <div className="flex justify-between">
                <span>Officer:</span>
                <span>officer@example.com</span>
              </div>
              <div className="flex justify-between">
                <span>Analyst:</span>
                <span>analyst@example.com</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
