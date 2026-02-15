import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await sql`
      SELECT id, name, account_start, base_risk_pct, risk_multiplier, stepsize_up,
             target_ev, gamification_enabled, created_at
      FROM traders ORDER BY id
    `;

    return NextResponse.json({ traders: result.rows });
  } catch (error) {
    console.error('Get traders error:', error);
    return NextResponse.json({ error: 'Failed to get traders' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { account_start, base_risk_pct, risk_multiplier, stepsize_up, target_ev, gamification_enabled } = body;

    await sql`
      UPDATE traders SET
        account_start = ${account_start},
        base_risk_pct = ${base_risk_pct},
        risk_multiplier = ${risk_multiplier},
        stepsize_up = ${stepsize_up},
        target_ev = ${target_ev},
        gamification_enabled = ${gamification_enabled}
      WHERE id = ${session.id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update trader error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
