import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { calculateStats } from '@/lib/calculations';
import { calculateLevelState } from '@/lib/gamification';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const traderId = searchParams.get('trader_id');

    // Get all traders
    const traders = await sql`
      SELECT id, name, account_start, base_risk_pct, risk_multiplier,
             stepsize_up, gamification_enabled
      FROM traders ORDER BY id
    `;

    const allStats = [];

    for (const trader of traders.rows) {
      if (traderId && trader.id !== parseInt(traderId)) continue;

      const trades = await sql`
        SELECT nett_r, pnl_usd, max_win_r, equity_after, analysed, date_entry
        FROM trades
        WHERE trader_id = ${trader.id}
        ORDER BY trade_number ASC
      `;

      const stats = calculateStats(
        trades.rows.map((t: Record<string, string | null>) => ({
          nett_r: t.nett_r ? parseFloat(t.nett_r) : null,
          pnl_usd: t.pnl_usd ? parseFloat(t.pnl_usd) : null,
          max_win_r: t.max_win_r ? parseFloat(t.max_win_r) : null,
        }))
      );

      const nettRs = trades.rows
        .filter((t: Record<string, string | null>) => t.nett_r !== null)
        .map((t: Record<string, string>) => parseFloat(t.nett_r));

      const levelState = calculateLevelState(nettRs, {
        base_risk_pct: parseFloat(trader.base_risk_pct),
        risk_multiplier: parseFloat(trader.risk_multiplier),
        stepsize_up: trader.stepsize_up,
        gamification_enabled: trader.gamification_enabled,
      });

      const lastEquity = trades.rows.length > 0 && trades.rows[trades.rows.length - 1].equity_after
        ? parseFloat(trades.rows[trades.rows.length - 1].equity_after)
        : parseFloat(trader.account_start);

      const unanalysed = trades.rows.filter((t: Record<string, boolean | null>) => !t.analysed && t.nett_r !== null).length;

      allStats.push({
        trader: {
          id: trader.id,
          name: trader.name,
          account_start: parseFloat(trader.account_start),
        },
        stats,
        level: levelState,
        currentEquity: lastEquity,
        unanalysedCount: unanalysed,
        totalTradesCount: trades.rows.length,
      });
    }

    return NextResponse.json({ stats: allStats });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 });
  }
}
