import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession, getTraderSettings } from '@/lib/auth';
import { calculateFields } from '@/lib/calculations';
import { calculateLevelState } from '@/lib/gamification';

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
        ORDER BY t.date_entry DESC, t.trade_number DESC
      `;
    }

    return NextResponse.json({ trades: result.rows });
  } catch (error) {
    console.error('Get trades error:', error);
    return NextResponse.json({ error: 'Failed to get trades' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      ticker, date_entry, date_exit, price_entry, price_stop, price_tp,
      price_exit, contracts, multiplier, max_win_r, reason_for_loss,
      win_optimization, screenshots, tags, notes,
    } = body;

    if (!ticker || !date_entry || price_entry === undefined || price_stop === undefined || !contracts) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get trader settings
    const settings = await getTraderSettings(session.id);

    // Get next trade number
    const lastTrade = await sql`
      SELECT trade_number FROM trades
      WHERE trader_id = ${session.id}
      ORDER BY trade_number DESC LIMIT 1
    `;
    const tradeNumber = lastTrade.rows.length > 0 ? lastTrade.rows[0].trade_number + 1 : 1;

    // Get previous equity
    const lastEquity = await sql`
      SELECT equity_after FROM trades
      WHERE trader_id = ${session.id} AND equity_after IS NOT NULL
      ORDER BY trade_number DESC LIMIT 1
    `;
    const equityBefore = lastEquity.rows.length > 0
      ? parseFloat(lastEquity.rows[0].equity_after)
      : parseFloat(settings.account_start);

    // Calculate gamification level
    const allTradesR = await sql`
      SELECT nett_r FROM trades
      WHERE trader_id = ${session.id} AND nett_r IS NOT NULL
      ORDER BY trade_number ASC
    `;
    const nettRs = allTradesR.rows.map((r) => parseFloat(r.nett_r as string));
    const levelState = calculateLevelState(nettRs, {
      base_risk_pct: parseFloat(settings.base_risk_pct),
      risk_multiplier: parseFloat(settings.risk_multiplier),
      stepsize_up: settings.stepsize_up,
      gamification_enabled: settings.gamification_enabled,
    });

    // Calculate trade fields
    const calculated = calculateFields(
      {
        price_entry: parseFloat(price_entry),
        price_stop: parseFloat(price_stop),
        price_exit: price_exit ? parseFloat(price_exit) : null,
        price_tp: price_tp || null,
        contracts: parseFloat(contracts),
        multiplier: parseFloat(multiplier) || 1,
      },
      equityBefore,
      levelState.currentRiskPct,
      parseFloat(settings.base_risk_pct)
    );

    // Calculate sum_r
    const currentSumR = nettRs.reduce((a: number, b: number) => a + b, 0);
    const newSumR = calculated.nett_r !== null ? currentSumR + calculated.nett_r : currentSumR;

    const result = await sql`
      INSERT INTO trades (
        trader_id, trade_number, ticker, date_entry, date_exit,
        price_entry, price_stop, price_tp, price_exit, contracts, multiplier,
        trade_r, nett_r, sum_r, planned_risk_usd, usd_at_risk, risk_r_factor,
        pnl_usd, equity_before, equity_after, level, level_to_go,
        risk_pct, normal_risk_pct, power_norm, analysed,
        max_win_r, reason_for_loss, win_optimization, screenshots, tags, notes
      ) VALUES (
        ${session.id}, ${tradeNumber}, ${ticker},
        ${date_entry}, ${date_exit || null},
        ${parseFloat(price_entry)}, ${parseFloat(price_stop)},
        ${price_tp || null}, ${price_exit ? parseFloat(price_exit) : null},
        ${parseFloat(contracts)}, ${parseFloat(multiplier) || 1},
        ${calculated.trade_r}, ${calculated.nett_r},
        ${Math.round(newSumR * 10000) / 10000},
        ${calculated.planned_risk_usd}, ${calculated.usd_at_risk},
        ${calculated.risk_r_factor}, ${calculated.pnl_usd},
        ${calculated.equity_before}, ${calculated.equity_after},
        ${levelState.level}, ${Math.ceil(levelState.rToNextLevel)},
        ${calculated.risk_pct}, ${calculated.normal_risk_pct},
        ${calculated.power_norm}, ${false},
        ${max_win_r ? parseFloat(max_win_r) : null},
        ${reason_for_loss || null}, ${win_optimization || null},
        ${screenshots || null}, ${tags || null}, ${notes || null}
      )
      RETURNING *
    `;

    return NextResponse.json({ trade: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Create trade error:', error);
    return NextResponse.json({ error: 'Failed to create trade' }, { status: 500 });
  }
}
