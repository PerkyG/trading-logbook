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

export default function TradeTable({ currentTraderId }: { currentTraderId: number }) {
  const router = useRouter();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [traders, setTraders] = useState<Trader[]>([]);
  const [filterTrader, setFilterTrader] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<string>('date_entry');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

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
                Date {sortField === 'date_entry' && (sortDir === 'asc' ? '\u2191' : '\u2193')}
              </th>
              <th className="text-left py-2 px-2">Ticker</th>
              <th className="text-right py-2 px-2">Entry</th>
              <th className="text-right py-2 px-2">Stop</th>
              <th className="text-right py-2 px-2">Exit</th>
              <th className="text-right py-2 px-2 cursor-pointer hover:text-white" onClick={() => toggleSort('nett_r')}>
                Nett R {sortField === 'nett_r' && (sortDir === 'asc' ? '\u2191' : '\u2193')}
              </th>
              <th className="text-right py-2 px-2">Sum R</th>
              <th className="text-right py-2 px-2 cursor-pointer hover:text-white" onClick={() => toggleSort('pnl_usd')}>
                PnL $ {sortField === 'pnl_usd' && (sortDir === 'asc' ? '\u2191' : '\u2193')}
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
                      {trade.analysed && '\u2713'}
                    </button>
                  </td>
                  <td className="py-2 px-2">
                    {expandedId === trade.id ? '\u25B2' : '\u25BC'}
                  </td>
                </tr>
                {expandedId === trade.id && (
                  <tr key={`${trade.id}-detail`} className="bg-gray-900/30">
                    <td colSpan={13} className="px-4 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-gray-500 text-xs mb-1">Position</div>
                          <div>{trade.contracts} contracts \u00D7 {trade.multiplier} multiplier</div>
                          <div className="text-gray-400">Planned Risk: ${formatNum(trade.planned_risk_usd, 0)}</div>
                          <div className="text-gray-400">$ at Risk: ${formatNum(trade.usd_at_risk, 0)}</div>
                          <div className="text-gray-400">Risk Factor: {formatNum(trade.risk_r_factor)}x</div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-xs mb-1">Performance</div>
                          <div>Trade R: <span className={rColor(trade.trade_r)}>{formatNum(trade.trade_r)}</span></div>
                          <div>Max Win R: {formatNum(trade.max_win_r)}</div>
                          <div>Equity: ${formatNum(trade.equity_before, 0)} → ${formatNum(trade.equity_after, 0)}</div>
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
    </div>
  );
}
