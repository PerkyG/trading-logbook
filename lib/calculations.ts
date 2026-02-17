export interface TradeInput {
  price_entry: number;
  price_stop: number;
  price_exit: number | null;
  price_tp: string | null; // partial TPs, e.g. "400@200.88, 742@201.97"
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

/**
 * Determine if trade is long or short.
 * Long: stop is below entry (stop < entry)
 * Short: stop is above entry (stop > entry)
 */
export function isLong(entry: number, stop: number): boolean {
  return stop < entry;
}

/**
 * Parse partial take profit string like "400@200.88, 742@201.97"
 * Returns array of { contracts, price } objects.
 * Also supports simple "200.88, 201.97" (just prices, no contracts prefix)
 */
export function parsePartialTPs(tpStr: string | null): Array<{ contracts: number; price: number }> | null {
  if (!tpStr || tpStr.trim() === '') return null;

  const parts = tpStr.split(',').map(s => s.trim()).filter(s => s);
  const results: Array<{ contracts: number; price: number }> = [];

  for (const part of parts) {
    if (part.includes('@')) {
      // Format: contracts@price
      const [contractsStr, priceStr] = part.split('@');
      const contracts = parseFloat(contractsStr);
      const price = parseFloat(priceStr);
      if (!isNaN(contracts) && !isNaN(price)) {
        results.push({ contracts, price });
      }
    } else {
      // Just a price, no contract count
      const price = parseFloat(part);
      if (!isNaN(price)) {
        results.push({ contracts: 0, price }); // contracts=0 means unknown
      }
    }
  }

  return results.length > 0 ? results : null;
}

/**
 * Calculate R-multiple for a trade.
 *
 * R = (profit per unit) / (risk per unit)
 *
 * For LONG:  risk per unit = entry - stop, profit per unit = exit - entry
 * For SHORT: risk per unit = stop - entry, profit per unit = entry - exit
 *
 * With partial take profits: weighted average exit price is used.
 * e.g. "400@200.88, 742@201.97" means 400 contracts closed at 200.88, 742 at 201.97
 * Weighted avg exit = (400*200.88 + 742*201.97) / (400+742)
 */
export function calculateTradeR(input: TradeInput): number | null {
  const riskPerUnit = Math.abs(input.price_entry - input.price_stop);
  if (riskPerUnit === 0) return 0;

  const long = isLong(input.price_entry, input.price_stop);

  // Try partial TPs first
  const partialTPs = parsePartialTPs(input.price_tp);

  if (partialTPs && partialTPs.length > 0 && partialTPs.some(tp => tp.contracts > 0)) {
    // Use weighted average exit from partial TPs
    const totalContracts = partialTPs.reduce((sum, tp) => sum + tp.contracts, 0);
    if (totalContracts > 0) {
      const weightedExitPrice = partialTPs.reduce((sum, tp) => sum + tp.contracts * tp.price, 0) / totalContracts;
      const profitPerUnit = long
        ? weightedExitPrice - input.price_entry
        : input.price_entry - weightedExitPrice;
      return profitPerUnit / riskPerUnit;
    }
  }

  // Fallback to single exit price
  if (input.price_exit === null) return null;

  const profitPerUnit = long
    ? input.price_exit - input.price_entry
    : input.price_entry - input.price_exit;

  return profitPerUnit / riskPerUnit;
}

/**
 * Calculate PnL in USD.
 * Supports partial take profits for more accurate PnL calculation.
 *
 * For LONG:  PnL = (exit - entry) * contracts * multiplier
 * For SHORT: PnL = (entry - exit) * contracts * multiplier
 */
export function calculatePnl(input: TradeInput): number | null {
  const long = isLong(input.price_entry, input.price_stop);
  const partialTPs = parsePartialTPs(input.price_tp);

  if (partialTPs && partialTPs.length > 0 && partialTPs.some(tp => tp.contracts > 0)) {
    // Calculate PnL from partial take profits
    let totalPnl = 0;
    let contractsClosed = 0;

    for (const tp of partialTPs) {
      if (tp.contracts > 0) {
        const profitPerUnit = long
          ? tp.price - input.price_entry
          : input.price_entry - tp.price;
        totalPnl += profitPerUnit * tp.contracts * input.multiplier;
        contractsClosed += tp.contracts;
      }
    }

    // If there's a final exit price for remaining contracts
    if (input.price_exit !== null && contractsClosed < input.contracts) {
      const remaining = input.contracts - contractsClosed;
      const profitPerUnit = long
        ? input.price_exit - input.price_entry
        : input.price_entry - input.price_exit;
      totalPnl += profitPerUnit * remaining * input.multiplier;
    }

    return totalPnl;
  }

  // Simple single exit
  if (input.price_exit === null) return null;

  const profitPerUnit = long
    ? input.price_exit - input.price_entry
    : input.price_entry - input.price_exit;

  return profitPerUnit * input.contracts * input.multiplier;
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
