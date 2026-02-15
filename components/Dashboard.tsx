'use client';

import { useState, useEffect } from 'react';
import AccountabilityBoard from './AccountabilityBoard';
import GamificationPanel from './GamificationPanel';
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

interface TraderSettings {
  base_risk_pct: string;
  stepsize_up: number;
  gamification_enabled: boolean;
}

export default function DashboardView({ currentTraderId }: { currentTraderId: number }) {
  const [allStats, setAllStats] = useState<TraderStats[]>([]);
  const [settings, setSettings] = useState<TraderSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/stats').then(r => r.json()),
      fetch('/api/traders').then(r => r.json()),
    ]).then(([statsData, tradersData]) => {
      setAllStats(statsData.stats || []);
      const myTrader = tradersData.traders?.find((t: { id: number }) => t.id === currentTraderId);
      if (myTrader) {
        setSettings({
          base_risk_pct: myTrader.base_risk_pct,
          stepsize_up: myTrader.stepsize_up,
          gamification_enabled: myTrader.gamification_enabled,
        });
      }
      setLoading(false);
    });
  }, [currentTraderId]);

  if (loading) return <div className="text-gray-400 p-4">Loading dashboard...</div>;

  const myStats = allStats.find(s => s.trader.id === currentTraderId);

  return (
    <div className="space-y-8">
      {/* My stats overview */}
      {myStats && (
        <div>
          <h2 className="text-xl font-bold mb-4">Your Performance</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
            <StatsCard
              label="Win Rate"
              value={`${(myStats.stats.winRate * 100).toFixed(0)}%`}
              color={myStats.stats.winRate >= 0.5 ? 'positive' : 'negative'}
            />
            <StatsCard
              label="EV / Trade"
              value={`${myStats.stats.ev.toFixed(2)}R`}
              color={myStats.stats.ev > 0 ? 'positive' : 'negative'}
            />
            <StatsCard
              label="Total PnL"
              value={`$${myStats.stats.totalPnl.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
              color={myStats.stats.totalPnl > 0 ? 'positive' : 'negative'}
            />
            <StatsCard
              label="Current Equity"
              value={`$${myStats.currentEquity.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
            />
            <StatsCard
              label="Sharpe Ratio"
              value={myStats.stats.sharpe.toFixed(2)}
              color={myStats.stats.sharpe > 1 ? 'positive' : 'neutral'}
            />
            <StatsCard
              label="Total Trades"
              value={myStats.stats.totalTrades}
            />
          </div>

          {/* Gamification */}
          {settings && (
            <GamificationPanel
              level={myStats.level.level}
              levelToGo={myStats.level.levelToGo}
              currentRiskPct={myStats.level.currentRiskPct}
              cumRSinceLevel={myStats.level.cumRSinceLevel}
              tradesSinceLevel={myStats.level.tradesSinceLevel}
              baseRiskPct={parseFloat(settings.base_risk_pct)}
              stepsizeUp={settings.stepsize_up}
              enabled={settings.gamification_enabled}
            />
          )}
        </div>
      )}

      {/* Accountability board */}
      <AccountabilityBoard allStats={allStats} />
    </div>
  );
}
