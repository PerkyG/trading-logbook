import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ success: true });
  const cookie = clearSessionCookie();
  response.headers.set('Set-Cookie', cookie['Set-Cookie']);
  return response;
}
