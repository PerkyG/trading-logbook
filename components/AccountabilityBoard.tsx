'use client';

import StatsCard from './StatsCard';

interface TraderStats {
  trader: { id: number; name: string; account_start: number };
  stats: {
    totalTrades: number;
    winRate: number;
    avgRWin: number;
    avgRLoss: number;
    ev: number;
    sharpe: number;
    totalPnl: number;
    stdev: number;
    bestTrade: number;
    worstTrade: number;
    avgMaxWinR: number;
  };
  level: {
    level: number;
    levelToGo: number;
    currentRiskPct: number;
    cumRSinceLevel: number;
    tradesSinceLevel: number;
  };
  currentEquity: number;
  unanalysedCount: number;
  totalTradesCount: number;
}

export default function AccountabilityBoard({ allStats }: { allStats: TraderStats[] }) {
  if (allStats.length === 0) {
    return <div className="text-gray-500">No trader data available.</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Accountability Board</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {allStats.map(({ trader, stats, level, currentEquity, unanalysedCount }) => (
          <div key={trader.id} className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{trader.name}</h3>
              <span className={`text-sm px-2 py-0.5 rounded-full ${
                level.level > 0 ? 'bg-emerald-900/50 text-emerald-300' :
                level.level < 0 ? 'bg-red-900/50 text-red-300' :
                'bg-gray-800 text-gray-400'
              }`}>
                Level {level.level}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <StatsCard
                label="Win Rate"
                value={`${(stats.winRate * 100).toFixed(0)}%`}
                color={stats.winRate >= 0.5 ? 'positive' : stats.winRate > 0 ? 'neutral' : 'negative'}
              />
              <StatsCard
                label="EV per Trade"
                value={`${stats.ev.toFixed(2)}R`}
                color={stats.ev > 0 ? 'positive' : stats.ev < 0 ? 'negative' : 'neutral'}
              />
              <StatsCard
                label="Total PnL"
                value={`$${stats.totalPnl.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
                color={stats.totalPnl > 0 ? 'positive' : stats.totalPnl < 0 ? 'negative' : 'neutral'}
              />
              <StatsCard
                label="Equity"
                value={`$${currentEquity.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
                subtext={`Start: $${trader.account_start.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
              />
              <StatsCard
                label="Sharpe"
                value={stats.sharpe.toFixed(2)}
                color={stats.sharpe > 1 ? 'positive' : stats.sharpe > 0.5 ? 'neutral' : 'negative'}
              />
              <StatsCard
                label="Trades"
                value={stats.totalTrades}
              />
            </div>

            {/* Attention flags */}
            <div className="space-y-1">
              {unanalysedCount > 0 && (
                <div className="flex items-center gap-2 text-xs text-yellow-400 bg-yellow-900/20 rounded px-2 py-1">
                  <span>{unanalysedCount} unanalysed trade{unanalysedCount > 1 ? 's' : ''}</span>
                </div>
              )}
              {stats.ev < 0 && stats.totalTrades >= 5 && (
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-900/20 rounded px-2 py-1">
                  <span>Negative EV - needs review</span>
                </div>
              )}
              {stats.winRate < 0.3 && stats.totalTrades >= 10 && (
                <div className="flex items-center gap-2 text-xs text-red-400 bg-red-900/20 rounded px-2 py-1">
                  <span>Win rate below 30%</span>
                </div>
              )}
              {level.level > 0 && (
                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-900/20 rounded px-2 py-1">
                  <span>Risk elevated: {(level.currentRiskPct * 100).toFixed(2)}%</span>
                </div>
              )}
            </div>

            {/* Additional stats */}
            <div className="mt-4 pt-3 border-t border-gray-800 text-xs text-gray-500 space-y-1">
              <div className="flex justify-between">
                <span>Avg R Win</span>
                <span className="stat-positive">{stats.avgRWin.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Avg R Loss</span>
                <span className="stat-negative">{stats.avgRLoss.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Stdev</span>
                <span>{stats.stdev.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Best Trade</span>
                <span className="stat-positive">{stats.bestTrade.toFixed(2)}R</span>
              </div>
              <div className="flex justify-between">
                <span>Worst Trade</span>
                <span className="stat-negative">{stats.worstTrade.toFixed(2)}R</span>
              </div>
              {stats.avgMaxWinR > 0 && (
                <div className="flex justify-between">
                  <span>Avg Max Win R</span>
                  <span>{stats.avgMaxWinR.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
