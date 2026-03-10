import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { seedDb } from '@/lib/seed';

export const runtime = 'nodejs';

export async function GET() {
  try {
    seedDb();
    const db = getDb();
    const items = db.prepare('SELECT * FROM kpi_items ORDER BY id').all();

    return NextResponse.json(items);
  } catch (error) {
    console.error('GET /api/kpi error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    seedDb();
    const db = getDb();
    const body = (await request.json()) as { indicator?: string; current?: number };

    if (!body.indicator || typeof body.current !== 'number') {
      return NextResponse.json({ error: 'indicator and current are required' }, { status: 400 });
    }

    db.prepare('UPDATE kpi_items SET current = ? WHERE indicator = ?').run(body.current, body.indicator);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/kpi error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
