'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const LOSS_REASONS = [
  'stop: too tight SL',
  'dpoc: opened under dpoc',
  'dpoc: started flagging under dpoc after opening',
  'wave logic: positional awareness off',
  'wave logic: tip of 3rd wave',
  'wave logic: no parent support',
  'wave logic: no sub support',
  'HL: no confirmation uptrend',
  'vwap: under vwap',
  'entry logic: knife catch',
  'bob: no basket strength not best of breed',
  'psychological: closed due fear',
  'psychological: closed @ BE & then profit',
  'emotion: closed in panic',
  'emotion: called tops',
  'management: left open for too long (winner2loser)',
  'logic: closed due to fixed RR exit',
  'logic: did not use strict wave logic trend tracking exit strategy',
  'no plan made',
];

export default function TradeForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLoss, setIsLoss] = useState(false);

  const [form, setForm] = useState({
    ticker: '',
    date_entry: '',
    date_exit: '',
    price_entry: '',
    price_stop: '',
    price_tp: '',
    price_exit: '',
    contracts: '',
    multiplier: '1',
    max_win_r: '',
    reason_for_loss: '',
    win_optimization: '',
    screenshots: '',
    tags: '',
    notes: '',
  });

  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);

  function updateField(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function toggleReason(reason: string) {
    setSelectedReasons(prev =>
      prev.includes(reason)
        ? prev.filter(r => r !== reason)
        : [...prev, reason]
    );
  }

  // Auto-detect long/short and calculate live R preview
  function getTradePreview() {
    const entry = parseFloat(form.price_entry);
    const stop = parseFloat(form.price_stop);
    const exit = parseFloat(form.price_exit);

    if (isNaN(entry) || isNaN(stop)) return null;

    const long = stop < entry;
    const direction = long ? 'LONG' : 'SHORT';
    const riskPerUnit = Math.abs(entry - stop);

    let tradeR: number | null = null;
    if (!isNaN(exit) && riskPerUnit > 0) {
      const profitPerUnit = long ? exit - entry : entry - exit;
      tradeR = profitPerUnit / riskPerUnit;
    }

    return { direction, riskPerUnit, tradeR };
  }

  const preview = getTradePreview();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const body = {
        ...form,
        price_entry: parseFloat(form.price_entry),
        price_stop: parseFloat(form.price_stop),
        price_exit: form.price_exit ? parseFloat(form.price_exit) : null,
        contracts: parseFloat(form.contracts),
        multiplier: parseFloat(form.multiplier) || 1,
        max_win_r: form.max_win_r ? parseFloat(form.max_win_r) : null,
        reason_for_loss: isLoss
          ? (selectedReasons.length > 0
            ? selectedReasons.join(', ')
            : form.reason_for_loss || null)
          : null,
        date_exit: form.date_exit || null,
      };

      const res = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create trade');
        return;
      }

      router.push('/trades');
      router.refresh();
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Core Trade Info */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Trade Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Ticker *</label>
            <input
              type="text"
              value={form.ticker}
              onChange={e => updateField('ticker', e.target.value)}
              className="input-field"
              placeholder="e.g. NQ1!, AAPL, ETHUSD"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Date Entry *</label>
            <input
              type="datetime-local"
              value={form.date_entry}
              onChange={e => updateField('date_entry', e.target.value)}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Date Exit</label>
            <input
              type="datetime-local"
              value={form.date_exit}
              onChange={e => updateField('date_exit', e.target.value)}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Prices */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Prices</h3>
          {preview && (
            <div className="flex items-center gap-3 text-sm">
              <span className={`px-2 py-0.5 rounded font-medium ${
                preview.direction === 'LONG'
                  ? 'bg-emerald-900/50 text-emerald-300'
                  : 'bg-red-900/50 text-red-300'
              }`}>
                {preview.direction}
              </span>
              {preview.tradeR !== null && (
                <span className={`font-medium ${preview.tradeR >= 0 ? 'stat-positive' : 'stat-negative'}`}>
                  {preview.tradeR.toFixed(2)}R
                </span>
              )}
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Entry Price *</label>
            <input
              type="number"
              step="any"
              value={form.price_entry}
              onChange={e => updateField('price_entry', e.target.value)}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Stop Price *</label>
            <input
              type="number"
              step="any"
              value={form.price_stop}
              onChange={e => updateField('price_stop', e.target.value)}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              TP <span className="text-gray-500">(e.g. 400@200.88, 742@201.97)</span>
            </label>
            <input
              type="text"
              value={form.price_tp}
              onChange={e => updateField('price_tp', e.target.value)}
              className="input-field"
              placeholder="contracts@price, contracts@price"
            />
            <p className="text-xs text-gray-600 mt-1">For partial TPs. R is averaged weighted by contracts.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Exit Price</label>
            <input
              type="number"
              step="any"
              value={form.price_exit}
              onChange={e => updateField('price_exit', e.target.value)}
              className="input-field"
            />
            <p className="text-xs text-gray-600 mt-1">Final exit or single exit price.</p>
          </div>
        </div>
      </div>

      {/* Position Size */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Position</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Contracts / Quantity *</label>
            <input
              type="number"
              step="any"
              value={form.contracts}
              onChange={e => updateField('contracts', e.target.value)}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Multiplier <span className="text-gray-500">(point value, default 1)</span>
            </label>
            <input
              type="number"
              step="any"
              value={form.multiplier}
              onChange={e => updateField('multiplier', e.target.value)}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Review */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Review & Analysis</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Max Win R</label>
            <input
              type="number"
              step="any"
              value={form.max_win_r}
              onChange={e => updateField('max_win_r', e.target.value)}
              className="input-field"
              placeholder="What was the max R this trade could have been?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Win Optimization</label>
            <textarea
              value={form.win_optimization}
              onChange={e => updateField('win_optimization', e.target.value)}
              className="input-field min-h-[60px]"
              placeholder="How could this trade have been better managed?"
            />
          </div>

          {/* Loss toggle + reasons */}
          <div className="border-t border-gray-800 pt-4">
            <label className="flex items-center gap-3 cursor-pointer mb-3">
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  isLoss
                    ? 'bg-red-600 border-red-500'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
                onClick={() => setIsLoss(!isLoss)}
              >
                {isLoss && <span className="text-white text-xs font-bold">{'\u2713'}</span>}
              </div>
              <span className="text-sm font-medium text-gray-300">This is a loss</span>
              <span className="text-xs text-gray-500">Check to add loss reasons and tags</span>
            </label>

            {isLoss && (
              <div className="space-y-3 pl-8 border-l-2 border-red-800/50">
                <div>
                  <label className="block text-sm font-medium text-red-400 mb-2">Reason for Loss</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {LOSS_REASONS.map(reason => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => toggleReason(reason)}
                        className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                          selectedReasons.includes(reason)
                            ? 'bg-red-900 border-red-700 text-red-200'
                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                        }`}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={form.reason_for_loss}
                    onChange={e => updateField('reason_for_loss', e.target.value)}
                    className="input-field"
                    placeholder="Or type custom reason..."
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Screenshots (URLs)</label>
            <input
              type="text"
              value={form.screenshots}
              onChange={e => updateField('screenshots', e.target.value)}
              className="input-field"
              placeholder="Comma-separated URLs"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Tags</label>
            <input
              type="text"
              value={form.tags}
              onChange={e => updateField('tags', e.target.value)}
              className="input-field"
              placeholder="e.g. split entry, knife catch, trend follow"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => updateField('notes', e.target.value)}
              className="input-field min-h-[80px]"
              placeholder="Any additional notes about this trade..."
            />
          </div>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving...' : 'Log Trade'}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => router.push('/trades')}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
