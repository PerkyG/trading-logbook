'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Trade {
  id: number;
  trader_id: number;
  trader_name: string;
  trade_number: number;
  ticker: string;
  date_entry: string;
  date_exit: string | null;
  price_entry: string;
  price_stop: string;
  price_exit: string | null;
  price_tp: string | null;
  contracts: string;
  multiplier: string;
  trade_r: string | null;
  nett_r: string | null;
  sum_r: string | null;
  pnl_usd: string | null;
  equity_before: string | null;
  equity_after: string | null;
  level: number;
  risk_pct: string | null;
  analysed: boolean;
  reason_for_loss: string | null;
  win_optimization: string | null;
  notes: string | null;
  tags: string | null;
  screenshots: string | null;
  max_win_r: string | null;
  planned_risk_usd: string | null;
  usd_at_risk: string | null;
  risk_r_factor: string | null;
}

interface Trader {
  id: number;
  name: string;
}

// ── EditModal ─────────────────────────────────────────────────────────────────
function EditModal({ trade, onClose, onSaved }: {
  trade: Trade;
  onClose: () => void;
  onSaved: (updated: Partial<Trade>) => void;
}) {
  const [form, setForm] = useState({
    ticker: trade.ticker ?? '',
    price_entry: trade.price_entry ?? '',
    price_stop: trade.price_stop ?? '',
    price_tp: trade.price_tp ?? '',
    contracts: trade.contracts ?? '',
    multiplier: trade.multiplier ?? '',
    date_exit: trade.date_exit ? trade.date_exit.slice(0, 16) : '',
    price_exit: trade.price_exit ?? '',
    max_win_r: trade.max_win_r ?? '',
    reason_for_loss: trade.reason_for_loss ?? '',
    win_optimization: trade.win_optimization ?? '',
    notes: trade.notes ?? '',
    tags: trade.tags ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function set(field: string, val: string) {
    setForm(prev => ({ ...prev, [field]: val }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body: Record<string, string | null> = {
        ticker: form.ticker || null,
        price_entry: form.price_entry || null,
        price_stop: form.price_stop || null,
        contracts: form.contracts || null,
        multiplier: form.multiplier || null,
        price_tp: form.price_tp || null,
        date_exit: form.date_exit || null,
        price_exit: form.price_exit || null,
        max_win_r: form.max_win_r || null,
        reason_for_loss: form.reason_for_loss || null,
        win_optimization: form.win_optimization || null,
        notes: form.notes || null,
        tags: form.tags || null,
      };

      const res = await fetch(`/api/trades/${trade.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) { setError('Opslaan mislukt'); setSaving(false); return; }
      const { trade: updated } = await res.json();
      onSaved(updated);
      onClose();
    } catch {
      setError('Netwerk fout');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl shadow-2xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white">
            Trade #{trade.trade_number} bewerken — {trade.ticker}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-2xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Entry data */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Entry</h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="col-span-2">
                <span className="text-xs text-gray-400 mb-1 block">Ticker</span>
                <input value={form.ticker} onChange={e => set('ticker', e.target.value.toUpperCase())}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase" />
              </label>
              <label>
                <span className="text-xs text-gray-400 mb-1 block">Entry prijs</span>
                <input type="number" step="any" value={form.price_entry} onChange={e => set('price_entry', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
              </label>
              <label>
                <span className="text-xs text-gray-400 mb-1 block">Stop</span>
                <input type="number" step="any" value={form.price_stop} onChange={e => set('price_stop', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
              </label>
              <label>
                <span className="text-xs text-gray-400 mb-1 block">Contracts</span>
                <input type="number" step="any" value={form.contracts} onChange={e => set('contracts', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
              </label>
              <label>
                <span className="text-xs text-gray-400 mb-1 block">Multiplier</span>
                <input type="number" step="any" value={form.multiplier} onChange={e => set('multiplier', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
              </label>
            </div>
          </div>

          {/* Exit data */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Exit</h3>
            <div className="grid grid-cols-2 gap-3">
              <label>
                <span className="text-xs text-gray-400 mb-1 block">Exit datum</span>
                <input type="datetime-local" value={form.date_exit} onChange={e => set('date_exit', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </label>
              <label>
                <span className="text-xs text-gray-400 mb-1 block">Exit prijs</span>
                <input type="number" step="any" value={form.price_exit} onChange={e => set('price_exit', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
              </label>
              <label>
                <span className="text-xs text-gray-400 mb-1 block">Take Profit</span>
                <input type="number" step="any" value={form.price_tp} onChange={e => set('price_tp', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
              </label>
              <label>
                <span className="text-xs text-gray-400 mb-1 block">Max Win R</span>
                <input type="number" step="any" value={form.max_win_r} onChange={e => set('max_win_r', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
              </label>
            </div>
          </div>

          {/* Analysis */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Analyse</h3>
            <div className="space-y-3">
              <label>
                <span className="text-xs text-gray-400 mb-1 block">Reden verlies</span>
                <input value={form.reason_for_loss} onChange={e => set('reason_for_loss', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </label>
              <label>
                <span className="text-xs text-gray-400 mb-1 block">Win optimalisatie</span>
                <input value={form.win_optimization} onChange={e => set('win_optimization', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </label>
              <label>
                <span className="text-xs text-gray-400 mb-1 block">Tags (komma-gescheiden)</span>
                <input value={form.tags} onChange={e => set('tags', e.target.value)}
                  placeholder="bijv. VWAP, breakout, missed-entry"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </label>
              <label>
                <span className="text-xs text-gray-400 mb-1 block">Notities</span>
                <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </label>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm transition-colors">
              {saving ? 'Opslaan...' : 'Opslaan'}
            </button>
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition-colors">
              Annuleer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── TradeTable ────────────────────────────────────────────────────────────────
export default function TradeTable({ currentTraderId }: { currentTraderId: number }) {
  const router = useRouter();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [traders, setTraders] = useState<Trader[]>([]);
  const [filterTrader, setFilterTrader] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<string>('date_entry');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/trades').then(r => r.json()),
      fetch('/api/traders').then(r => r.json()),
    ]).then(([tradesData, tradersData]) => {
      setTrades(tradesData.trades || []);
      setTraders(tradersData.traders || []);
      setLoading(false);
    });
  }, []);

  async function toggleAnalysed(trade: Trade) {
    const res = await fetch(`/api/trades/${trade.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysed: !trade.analysed }),
    });
    if (res.ok) {
      setTrades(prev =>
        prev.map(t => t.id === trade.id ? { ...t, analysed: !t.analysed } : t)
      );
    }
  }

  async function deleteTrade(id: number) {
    setDeletingId(id);
    const res = await fetch(`/api/trades/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setTrades(prev => prev.filter(t => t.id !== id));
      if (expandedId === id) setExpandedId(null);
    }
    setDeletingId(null);
  }

  function handleEditSaved(updated: Partial<Trade>) {
    setTrades(prev => prev.map(t => t.id === updated.id ? { ...t, ...updated } : t));
  }

  const filtered = trades.filter(t =>
    filterTrader === 'all' || t.trader_id === parseInt(filterTrader)
  );

  const sorted = [...filtered].sort((a, b) => {
    let aVal: number, bVal: number;
    if (sortField === 'date_entry') {
      aVal = new Date(a.date_entry).getTime();
      bVal = new Date(b.date_entry).getTime();
    } else if (sortField === 'nett_r') {
      aVal = parseFloat(a.nett_r || '0');
      bVal = parseFloat(b.nett_r || '0');
    } else if (sortField === 'pnl_usd') {
      aVal = parseFloat(a.pnl_usd || '0');
      bVal = parseFloat(b.pnl_usd || '0');
    } else {
      aVal = a.trade_number;
      bVal = b.trade_number;
    }
    return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
  });

  function toggleSort(field: string) {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  }

  function formatNum(n: string | null, decimals = 2) {
    if (n === null || n === '') return '-';
    const num = parseFloat(n);
    return num.toFixed(decimals);
  }

  function rColor(n: string | null) {
    if (n === null) return '';
    return parseFloat(n) >= 0 ? 'stat-positive' : 'stat-negative';
  }

  if (loading) return <div className="text-gray-400 p-4">Loading trades...</div>;

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterTrader('all')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filterTrader === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            All Traders
          </button>
          {traders.map(t => (
            <button
              key={t.id}
              onClick={() => setFilterTrader(String(t.id))}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                filterTrader === String(t.id)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
        <span className="text-gray-500 text-sm ml-auto">{sorted.length} trades</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400">
              <th className="text-left py-2 px-2">#</th>
              <th className="text-left py-2 px-2">Trader</th>
              <th className="text-left py-2 px-2 cursor-pointer hover:text-white" onClick={() => toggleSort('date_entry')}>
                Date {sortField === 'date_entry' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-left py-2 px-2">Ticker</th>
              <th className="text-right py-2 px-2">Entry</th>
              <th className="text-right py-2 px-2">Stop</th>
              <th className="text-right py-2 px-2">Exit</th>
              <th className="text-right py-2 px-2 cursor-pointer hover:text-white" onClick={() => toggleSort('nett_r')}>
                Nett R {sortField === 'nett_r' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-right py-2 px-2">Sum R</th>
              <th className="text-right py-2 px-2 cursor-pointer hover:text-white" onClick={() => toggleSort('pnl_usd')}>
                PnL $ {sortField === 'pnl_usd' && (sortDir === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-center py-2 px-2">Lvl</th>
              <th className="text-center py-2 px-2">Analysed</th>
              <th className="text-left py-2 px-2"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(trade => (
              <>
                <tr
                  key={trade.id}
                  className="border-b border-gray-800/50 hover:bg-gray-900/50 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === trade.id ? null : trade.id)}
                >
                  <td className="py-2 px-2 text-gray-500">{trade.trade_number}</td>
                  <td className="py-2 px-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      trade.trader_id === currentTraderId
                        ? 'bg-blue-900/50 text-blue-300'
                        : 'bg-gray-800 text-gray-400'
                    }`}>
                      {trade.trader_name}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-gray-300">{formatDate(trade.date_entry)}</td>
                  <td className="py-2 px-2 font-medium">{trade.ticker}</td>
                  <td className="py-2 px-2 text-right text-gray-300">{formatNum(trade.price_entry, 2)}</td>
                  <td className="py-2 px-2 text-right text-gray-300">{formatNum(trade.price_stop, 2)}</td>
                  <td className="py-2 px-2 text-right text-gray-300">{formatNum(trade.price_exit, 2)}</td>
                  <td className={`py-2 px-2 text-right font-medium ${rColor(trade.nett_r)}`}>
                    {formatNum(trade.nett_r)}
                  </td>
                  <td className={`py-2 px-2 text-right ${rColor(trade.sum_r)}`}>
                    {formatNum(trade.sum_r)}
                  </td>
                  <td className={`py-2 px-2 text-right font-medium ${rColor(trade.pnl_usd)}`}>
                    {trade.pnl_usd ? `$${formatNum(trade.pnl_usd, 0)}` : '-'}
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      trade.level > 0 ? 'bg-emerald-900/50 text-emerald-300' :
                      trade.level < 0 ? 'bg-red-900/50 text-red-300' :
                      'bg-gray-800 text-gray-400'
                    }`}>
                      {trade.level}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <button
                      onClick={e => { e.stopPropagation(); toggleAnalysed(trade); }}
                      className={`w-5 h-5 rounded border transition-colors ${
                        trade.analysed
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                      disabled={trade.trader_id !== currentTraderId}
                    >
                      {trade.analysed && '✓'}
                    </button>
                  </td>
                  <td className="py-2 px-2">
                    {expandedId === trade.id ? '▲' : '▼'}
                  </td>
                </tr>
                {expandedId === trade.id && (
                  <tr key={`${trade.id}-detail`} className="bg-gray-900/30">
                    <td colSpan={13} className="px-4 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-gray-500 text-xs mb-1">Position</div>
                          <div>{trade.contracts} contracts &times; {trade.multiplier} multiplier</div>
                          <div className="text-gray-400">Planned Risk: ${formatNum(trade.planned_risk_usd, 0)}</div>
                          <div className="text-gray-400">$ at Risk: ${formatNum(trade.usd_at_risk, 0)}</div>
                          <div className="text-gray-400">Risk Factor: {formatNum(trade.risk_r_factor)}x</div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-xs mb-1">Performance</div>
                          <div>Trade R: <span className={rColor(trade.trade_r)}>{formatNum(trade.trade_r)}</span></div>
                          <div>Max Win R: {formatNum(trade.max_win_r)}</div>
                          <div>Equity: ${formatNum(trade.equity_before, 0)} &rarr; ${formatNum(trade.equity_after, 0)}</div>
                          <div>Risk %: {trade.risk_pct ? (parseFloat(trade.risk_pct) * 100).toFixed(2) + '%' : '-'}</div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-xs mb-1">Analysis</div>
                          {trade.reason_for_loss && (
                            <div className="mb-1">
                              <span className="text-red-400">Loss reason:</span>{' '}
                              <span className="text-gray-300">{trade.reason_for_loss}</span>
                            </div>
                          )}
                          {trade.win_optimization && (
                            <div className="mb-1">
                              <span className="text-yellow-400">Optimization:</span>{' '}
                              <span className="text-gray-300">{trade.win_optimization}</span>
                            </div>
                          )}
                          {trade.tags && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {trade.tags.split(',').map((tag, i) => (
                                <span key={i} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                                  {tag.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        {trade.notes && (
                          <div className="col-span-full">
                            <div className="text-gray-500 text-xs mb-1">Notes</div>
                            <div className="text-gray-300">{trade.notes}</div>
                          </div>
                        )}
                        {trade.screenshots && (
                          <div className="col-span-full">
                            <div className="text-gray-500 text-xs mb-1">Screenshots</div>
                            <div className="flex flex-wrap gap-2">
                              {trade.screenshots.split(',').map((url, i) => (
                                <a
                                  key={i}
                                  href={url.trim()}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300 text-xs underline"
                                >
                                  Screenshot {i + 1}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Edit / Delete – alleen voor eigen trades */}
                      {trade.trader_id === currentTraderId && (
                        <div className="flex gap-2 mt-4 pt-3 border-t border-gray-700/50">
                          <button
                            onClick={e => { e.stopPropagation(); setEditingTrade(trade); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-900/40 hover:bg-blue-900/70 text-blue-300 hover:text-blue-200 text-xs font-medium transition-colors border border-blue-800/50"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                            </svg>
                            Bewerken
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              if (confirm(`Trade #${trade.trade_number} (${trade.ticker}) definitief verwijderen?`)) {
                                deleteTrade(trade.id);
                              }
                            }}
                            disabled={deletingId === trade.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/30 hover:bg-red-900/60 text-red-400 hover:text-red-300 text-xs font-medium transition-colors border border-red-800/40 disabled:opacity-50"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                            {deletingId === trade.id ? 'Verwijderen...' : 'Verwijderen'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {sorted.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No trades yet.{' '}
          <button onClick={() => router.push('/trades/new')} className="text-blue-400 hover:text-blue-300">
            Log your first trade
          </button>
        </div>
      )}

      {/* Edit modal */}
      {editingTrade && (
        <EditModal
          trade={editingTrade}
          onClose={() => setEditingTrade(null)}
          onSaved={handleEditSaved}
        />
      )}
    </div>
  );
}
