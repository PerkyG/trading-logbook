import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { sql } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const COOKIE_NAME = 'trading-logbook-session';

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

export function createToken(traderId: number, traderName: string): string {
  return jwt.sign({ id: traderId, name: traderName }, JWT_SECRET, {
    expiresIn: '30d',
  });
}

export function verifyToken(token: string): { id: number; name: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: number; name: string };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<{ id: number; name: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getSessionOrThrow(): Promise<{ id: number; name: string }> {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session;
}

export function setSessionCookie(token: string) {
  return {
    'Set-Cookie': `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`,
  };
}

export function clearSessionCookie() {
  return {
    'Set-Cookie': `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
  };
}

export async function getTraderSettings(traderId: number) {
  const result = await sql`
    SELECT account_start, base_risk_pct, risk_multiplier, stepsize_up, target_ev, gamification_enabled
    FROM traders WHERE id = ${traderId}
  `;
  return result.rows[0];
}
