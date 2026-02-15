import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { hashPin, createToken, setSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { name, pin, account_start } = await request.json();

    if (!name || !pin) {
      return NextResponse.json({ error: 'Name and PIN are required' }, { status: 400 });
    }

    if (pin.length < 4 || pin.length > 8) {
      return NextResponse.json({ error: 'PIN must be 4-8 characters' }, { status: 400 });
    }

    // Check max 3 traders
    const count = await sql`SELECT COUNT(*) as count FROM traders`;
    if (parseInt(count.rows[0].count) >= 3) {
      return NextResponse.json({ error: 'Maximum 3 traders allowed' }, { status: 400 });
    }

    // Check if name already exists
    const existing = await sql`SELECT id FROM traders WHERE LOWER(name) = LOWER(${name})`;
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Name already taken' }, { status: 400 });
    }

    const pinHash = await hashPin(pin);
    const accountStartVal = parseFloat(account_start) || 10000;

    const result = await sql`
      INSERT INTO traders (name, pin_hash, account_start)
      VALUES (${name}, ${pinHash}, ${accountStartVal})
      RETURNING id, name
    `;

    const trader = result.rows[0];
    const token = createToken(trader.id, trader.name);

    const response = NextResponse.json({ success: true, trader: { id: trader.id, name: trader.name } });
    const cookie = setSessionCookie(token);
    response.headers.set('Set-Cookie', cookie['Set-Cookie']);

    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
