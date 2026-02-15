export interface TradeInput {
  price_entry: number;
  price_stop: number;
  price_exit: number | null;
  contracts: number;
  multiplier: number;
}

export interface TraderSettings {
  account_start: number;
  base_risk_pct: number;
  risk_multiplier: number;
  stepsize_up: number;
  gamification_enabled: boolean;
}

export interface CalculatedFields {
  trade_r: number | null;
  pnl_usd: number | null;
  usd_at_risk: number;
  planned_risk_usd: number;
  risk_r_factor: number;
  nett_r: number | null;
  equity_before: number;
  equity_after: number | null;
  risk_pct: number;
  normal_risk_pct: number;
  power_norm: number;
}

export function isLong(entry: number, stop: number): boolean {
  return stop < entry;
}

export function calculateTradeR(input: TradeInput): number | null {
  if (input.price_exit === null) return null;
  const riskPerUnit = Math.abs(input.price_entry - input.price_stop);
  if (riskPerUnit === 0) return 0;
  const direction = isLong(input.price_entry, input.price_stop) ? 1 : -1;
  return ((input.price_exit - input.price_entry) * direction) / riskPerUnit;
}

export function calculatePnl(input: TradeInput): number | null {
  if (input.price_exit === null) return null;
  return (input.price_exit - input.price_entry) * input.contracts * input.multiplier;
}

export function calculateUsdAtRisk(input: TradeInput): number {
  return Math.abs(input.price_entry - input.price_stop) * input.contracts * input.multiplier;
}

export function calculateFields(
  input: TradeInput,
  equityBefore: number,
  currentRiskPct: number,
  baseRiskPct: number
): CalculatedFields {
  const plannedRiskUsd = equityBefore * currentRiskPct;
  const usdAtRisk = calculateUsdAtRisk(input);
  const riskRFactor = plannedRiskUsd > 0 ? usdAtRisk / plannedRiskUsd : 1;
  const tradeR = calculateTradeR(input);
  const pnlUsd = calculatePnl(input);
  const nettR = pnlUsd !== null && plannedRiskUsd > 0 ? pnlUsd / plannedRiskUsd : null;
  const equityAfter = pnlUsd !== null ? equityBefore + pnlUsd : null;
  const normalRiskPct = baseRiskPct;
  const powerNorm = baseRiskPct > 0 ? currentRiskPct / baseRiskPct : 1;

  return {
    trade_r: tradeR !== null ? Math.round(tradeR * 10000) / 10000 : null,
    pnl_usd: pnlUsd !== null ? Math.round(pnlUsd * 100) / 100 : null,
    usd_at_risk: Math.round(usdAtRisk * 100) / 100,
    planned_risk_usd: Math.round(plannedRiskUsd * 100) / 100,
    risk_r_factor: Math.round(riskRFactor * 100) / 100,
    nett_r: nettR !== null ? Math.round(nettR * 10000) / 10000 : null,
    equity_before: Math.round(equityBefore * 100) / 100,
    equity_after: equityAfter !== null ? Math.round(equityAfter * 100) / 100 : null,
    risk_pct: currentRiskPct,
    normal_risk_pct: normalRiskPct,
    power_norm: Math.round(powerNorm * 10000) / 10000,
  };
}

export function calculateStats(trades: Array<{ nett_r: number | null; pnl_usd: number | null; max_win_r: number | null }>) {
  const closedTrades = trades.filter(t => t.nett_r !== null);
  if (closedTrades.length === 0) {
    return {
      totalTrades: 0,
      winRate: 0,
      avgRWin: 0,
      avgRLoss: 0,
      ev: 0,
      sharpe: 0,
      totalPnl: 0,
      stdev: 0,
      bestTrade: 0,
      worstTrade: 0,
      avgMaxWinR: 0,
    };
  }

  const rs = closedTrades.map(t => t.nett_r!);
  const wins = rs.filter(r => r > 0);
  const losses = rs.filter(r => r <= 0);

  const winRate = wins.length / rs.length;
  const avgRWin = wins.length > 0 ? wins.reduce((a, b) => a + b, 0) / wins.length : 0;
  const avgRLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0;
  const ev = rs.reduce((a, b) => a + b, 0) / rs.length;
  const totalPnl = closedTrades.reduce((a, t) => a + (t.pnl_usd || 0), 0);

  const mean = ev;
  const variance = rs.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / rs.length;
  const stdev = Math.sqrt(variance);
  const sharpe = stdev > 0 ? ev / stdev : 0;

  const maxWinRs = closedTrades.filter(t => t.max_win_r !== null).map(t => t.max_win_r!);
  const avgMaxWinR = maxWinRs.length > 0 ? maxWinRs.reduce((a, b) => a + b, 0) / maxWinRs.length : 0;

  return {
    totalTrades: closedTrades.length,
    winRate: Math.round(winRate * 10000) / 10000,
    avgRWin: Math.round(avgRWin * 100) / 100,
    avgRLoss: Math.round(avgRLoss * 100) / 100,
    ev: Math.round(ev * 100) / 100,
    sharpe: Math.round(sharpe * 100) / 100,
    totalPnl: Math.round(totalPnl * 100) / 100,
    stdev: Math.round(stdev * 100) / 100,
    bestTrade: Math.round(Math.max(...rs) * 100) / 100,
    worstTrade: Math.round(Math.min(...rs) * 100) / 100,
    avgMaxWinR: Math.round(avgMaxWinR * 100) / 100,
  };
}
