import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyPin, createToken, setSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { name, pin } = await request.json();

    if (!name || !pin) {
      return NextResponse.json({ error: 'Name and PIN are required' }, { status: 400 });
    }

    const result = await sql`
      SELECT id, name, pin_hash FROM traders WHERE LOWER(name) = LOWER(${name})
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid name or PIN' }, { status: 401 });
    }

    const trader = result.rows[0];
    const valid = await verifyPin(pin, trader.pin_hash);

    if (!valid) {
      return NextResponse.json({ error: 'Invalid name or PIN' }, { status: 401 });
    }

    const token = createToken(trader.id, trader.name);
    const response = NextResponse.json({ success: true, trader: { id: trader.id, name: trader.name } });
    const cookie = setSessionCookie(token);
    response.headers.set('Set-Cookie', cookie['Set-Cookie']);

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
