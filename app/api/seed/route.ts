import { createTables } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await createTables();
    return NextResponse.json({ message: 'Tables created successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create tables', details: String(error) },
      { status: 500 }
    );
  }
}
