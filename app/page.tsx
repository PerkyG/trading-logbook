'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [accountStart, setAccountStart] = useState('10000');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body: Record<string, string> = { name, pin };
      if (mode === 'register') {
        body.account_start = accountStart;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-2">Trading Logbook</h1>
        <p className="text-gray-400 text-center text-sm mb-8">
          Shared logbook for accountability and growth
        </p>

        <div className="flex mb-6 bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              mode === 'login' ? 'bg-gray-700 text-white' : 'text-gray-400'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              mode === 'register' ? 'bg-gray-700 text-white' : 'text-gray-400'
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Trader Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="input-field"
              placeholder="Your name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              PIN (4-8 digits)
            </label>
            <input
              type="password"
              value={pin}
              onChange={e => setPin(e.target.value)}
              className="input-field"
              placeholder="Enter your PIN"
              minLength={4}
              maxLength={8}
              required
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Starting Account Size (USD)
              </label>
              <input
                type="number"
                value={accountStart}
                onChange={e => setAccountStart(e.target.value)}
                className="input-field"
                placeholder="10000"
                min={1}
                step="0.01"
                required
              />
            </div>
          )}

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Loading...' : mode === 'login' ? 'Login' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
}
