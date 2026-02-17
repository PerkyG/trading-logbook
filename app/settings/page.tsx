'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';

interface TraderSettings {
  id: number;
  name: string;
  account_start: string;
  base_risk_pct: string;
  risk_multiplier: string;
  stepsize_up: number;
  target_ev: string;
  gamification_enabled: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<TraderSettings | null>(null);
  const [traderName, setTraderName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({
    account_start: '',
    base_risk_pct: '',
    risk_multiplier: '',
    stepsize_up: '',
    target_ev: '',
    gamification_enabled: true,
  });

  useEffect(() => {
    fetch('/api/traders').then(r => r.json()).then(data => {
      // Find current trader (we need to check session)
      // For simplicity, get session info from a separate call
      fetch('/api/stats').then(r => r.json()).then(statsData => {
        if (statsData.stats && statsData.stats.length > 0) {
          // Find the current trader from traders list
          const traders = data.traders || [];
          // We'll use the first trader's data for now - the API will match by session
          // Actually, let's find the right trader
          const myStats = statsData.stats;
          if (myStats.length > 0) {
            const firstTrader = traders.find((t: TraderSettings) =>
              myStats.some((s: { trader: { id: number } }) => s.trader.id === t.id)
            );
            if (firstTrader) {
              setSettings(firstTrader);
              setTraderName(firstTrader.name);
              setForm({
                account_start: firstTrader.account_start,
                base_risk_pct: (parseFloat(firstTrader.base_risk_pct) * 100).toFixed(2),
                risk_multiplier: firstTrader.risk_multiplier,
                stepsize_up: String(firstTrader.stepsize_up),
                target_ev: firstTrader.target_ev,
                gamification_enabled: firstTrader.gamification_enabled,
              });
            }
          }
        }
        setLoading(false);
      });
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/traders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_start: parseFloat(form.account_start),
          base_risk_pct: parseFloat(form.base_risk_pct) / 100,
          risk_multiplier: parseFloat(form.risk_multiplier),
          stepsize_up: parseInt(form.stepsize_up),
          target_ev: parseFloat(form.target_ev),
          gamification_enabled: form.gamification_enabled,
        }),
      });

      if (res.ok) {
        setMessage('Settings saved successfully');
      } else {
        const data = await res.json();
        setMessage(data.error || 'Failed to save');
      }
    } catch {
      setMessage('Network error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar traderName={traderName} />
        <main className="max-w-2xl mx-auto px-4 py-6">
          <div className="text-gray-400">Loading settings...</div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar traderName={traderName} />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Account</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Starting Account Size (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.account_start}
                  onChange={e => setForm(prev => ({ ...prev, account_start: e.target.value }))}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Risk Management</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Base Risk (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.base_risk_pct}
                  onChange={e => setForm(prev => ({ ...prev, base_risk_pct: e.target.value }))}
                  className="input-field"
                />
                <p className="text-xs text-gray-500 mt-1">Percentage of account risked per trade at level 0</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Target EV (R)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.target_ev}
                  onChange={e => setForm(prev => ({ ...prev, target_ev: e.target.value }))}
                  className="input-field"
                />
                <p className="text-xs text-gray-500 mt-1">Target expected value per trade</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Gamification</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.gamification_enabled}
                  onChange={e => setForm(prev => ({ ...prev, gamification_enabled: e.target.checked }))}
                  className="w-4 h-4 rounded bg-gray-800 border-gray-600"
                />
                <span className="text-sm text-gray-400">Enabled</span>
              </label>
            </div>

            {form.gamification_enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    R Threshold to Level Up
                  </label>
                  <input
                    type="number"
                    value={form.stepsize_up}
                    onChange={e => setForm(prev => ({ ...prev, stepsize_up: e.target.value }))}
                    className="input-field"
                  />
                  <p className="text-xs text-gray-500 mt-1">Cumulative R needed to level up (e.g. 30 = 30R)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Risk Multiplier
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.risk_multiplier}
                    onChange={e => setForm(prev => ({ ...prev, risk_multiplier: e.target.value }))}
                    className="input-field"
                  />
                  <p className="text-xs text-gray-500 mt-1">Risk multiplied by this when leveling up (e.g. 1.5x)</p>
                </div>
              </div>
            )}
          </div>

          {message && (
            <p className={`text-sm ${message.includes('success') ? 'text-emerald-400' : 'text-red-400'}`}>
              {message}
            </p>
          )}

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>

        {/* Reference info */}
        <div className="card mt-8">
          <h3 className="text-lg font-semibold mb-3">Reference: Pro System Archetypes</h3>
          <div className="text-sm text-gray-400 space-y-2">
            <p><strong className="text-gray-300">Mean Reversion:</strong> ~60% WR, ~1.2R avg wins</p>
            <p><strong className="text-gray-300">Balanced:</strong> ~50% WR, ~1.6R avg wins</p>
            <p><strong className="text-gray-300">Trend Follower:</strong> ~40% WR, ~2.2R avg wins</p>
            <p className="text-gray-500 mt-2">Each yields EV ~0.2-0.5R per trade. Sharpe ~1.0-1.5 baseline professional.</p>
          </div>
        </div>
      </main>
    </>
  );
}
