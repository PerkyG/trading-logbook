import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const traderId = searchParams.get('trader_id');

    let result;
    if (traderId) {
      result = await sql`
        SELECT t.*, tr.name as trader_name
        FROM trades t JOIN traders tr ON t.trader_id = tr.id
        WHERE t.trader_id = ${parseInt(traderId)}
        ORDER BY t.trade_number ASC
      `;
    } else {
      result = await sql`
        SELECT t.*, tr.name as trader_name
        FROM trades t JOIN traders tr ON t.trader_id = tr.id
        ORDER BY tr.name, t.trade_number ASC
      `;
    }

    const headers = [
      'Trader', 'Trade #', 'Ticker', 'Date Entry', 'Date Exit',
      'Entry', 'Stop', 'TP', 'Exit', 'Contracts', 'Multiplier',
      'Trade R', 'Nett R', 'Sum R', 'Planned Risk $', '$ at Risk',
      'Risk Factor', 'PnL $', 'Equity Before', 'Equity After',
      'Level', 'Level to Go', 'Risk %', 'Normal Risk %', 'Power/Norm',
      'Analysed', 'Max Win R', 'Reason for Loss', 'Win Optimization',
      'Screenshots', 'Tags', 'Notes',
    ];

    const rows = result.rows.map((t: Record<string, unknown>) => [
      t.trader_name, t.trade_number, t.ticker, t.date_entry, t.date_exit || '',
      t.price_entry, t.price_stop, t.price_tp || '', t.price_exit || '',
      t.contracts, t.multiplier, t.trade_r || '', t.nett_r || '',
      t.sum_r || '', t.planned_risk_usd || '', t.usd_at_risk || '',
      t.risk_r_factor || '', t.pnl_usd || '', t.equity_before || '',
      t.equity_after || '', t.level, t.level_to_go, t.risk_pct || '',
      t.normal_risk_pct || '', t.power_norm || '', t.analysed ? 'Yes' : 'No',
      t.max_win_r || '', t.reason_for_loss || '', t.win_optimization || '',
      t.screenshots || '', t.tags || '', t.notes || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row: unknown[]) =>
        row.map(cell => {
          const str = String(cell);
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        }).join(',')
      ),
    ].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="trading-logbook-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 });
  }
}
