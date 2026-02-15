import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await sql`
      SELECT t.*, tr.name as trader_name
      FROM trades t JOIN traders tr ON t.trader_id = tr.id
      WHERE t.id = ${parseInt(params.id)}
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
    }

    return NextResponse.json({ trade: result.rows[0] });
  } catch (error) {
    console.error('Get trade error:', error);
    return NextResponse.json({ error: 'Failed to get trade' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const existing = await sql`
      SELECT trader_id FROM trades WHERE id = ${parseInt(params.id)}
    `;
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
    }
    if (existing.rows[0].trader_id !== session.id) {
      return NextResponse.json({ error: 'Can only edit your own trades' }, { status: 403 });
    }

    const body = await request.json();

    // Build dynamic update
    const updates: string[] = [];
    const values: (string | number | boolean | null)[] = [];

    const allowedFields = [
      'date_exit', 'price_exit', 'price_tp', 'analysed', 'max_win_r',
      'reason_for_loss', 'win_optimization', 'screenshots', 'tags', 'notes',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates.push(field);
        values.push(body[field]);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // For simplicity, update fields individually
    // In production you'd build a proper dynamic query
    if (body.analysed !== undefined) {
      await sql`UPDATE trades SET analysed = ${body.analysed} WHERE id = ${parseInt(params.id)}`;
    }
    if (body.reason_for_loss !== undefined) {
      await sql`UPDATE trades SET reason_for_loss = ${body.reason_for_loss} WHERE id = ${parseInt(params.id)}`;
    }
    if (body.win_optimization !== undefined) {
      await sql`UPDATE trades SET win_optimization = ${body.win_optimization} WHERE id = ${parseInt(params.id)}`;
    }
    if (body.max_win_r !== undefined) {
      await sql`UPDATE trades SET max_win_r = ${body.max_win_r ? parseFloat(body.max_win_r) : null} WHERE id = ${parseInt(params.id)}`;
    }
    if (body.notes !== undefined) {
      await sql`UPDATE trades SET notes = ${body.notes} WHERE id = ${parseInt(params.id)}`;
    }
    if (body.tags !== undefined) {
      await sql`UPDATE trades SET tags = ${body.tags} WHERE id = ${parseInt(params.id)}`;
    }
    if (body.screenshots !== undefined) {
      await sql`UPDATE trades SET screenshots = ${body.screenshots} WHERE id = ${parseInt(params.id)}`;
    }
    if (body.price_exit !== undefined) {
      await sql`UPDATE trades SET price_exit = ${body.price_exit ? parseFloat(body.price_exit) : null} WHERE id = ${parseInt(params.id)}`;
    }
    if (body.date_exit !== undefined) {
      await sql`UPDATE trades SET date_exit = ${body.date_exit} WHERE id = ${parseInt(params.id)}`;
    }
    if (body.price_tp !== undefined) {
      await sql`UPDATE trades SET price_tp = ${body.price_tp} WHERE id = ${parseInt(params.id)}`;
    }

    const updated = await sql`
      SELECT t.*, tr.name as trader_name
      FROM trades t JOIN traders tr ON t.trader_id = tr.id
      WHERE t.id = ${parseInt(params.id)}
    `;

    return NextResponse.json({ trade: updated.rows[0] });
  } catch (error) {
    console.error('Update trade error:', error);
    return NextResponse.json({ error: 'Failed to update trade' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await sql`
      SELECT trader_id FROM trades WHERE id = ${parseInt(params.id)}
    `;
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 });
    }
    if (existing.rows[0].trader_id !== session.id) {
      return NextResponse.json({ error: 'Can only delete your own trades' }, { status: 403 });
    }

    await sql`DELETE FROM trades WHERE id = ${parseInt(params.id)}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete trade error:', error);
    return NextResponse.json({ error: 'Failed to delete trade' }, { status: 500 });
  }
}
