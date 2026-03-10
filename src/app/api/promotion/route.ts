import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { seedDb } from '@/lib/seed';
import type { LivingLabPhase, ProgressStatus, PromotionChannel, PromotionRecord } from '@/lib/types';

export const runtime = 'nodejs';

type RequestPayload = {
  id?: number;
  field?: string;
  value?: unknown;
  changes?: Record<string, unknown>;
};

const promotionFields = new Set([
  'channel',
  'title',
  'published_date',
  'phase',
  'reach_count',
  'url',
  'status',
  'notes',
]);

function normalizePromotionValue(field: string, value: unknown) {
  if (field === 'channel') {
    return String(value) as PromotionChannel;
  }

  if (field === 'status') {
    return String(value) as ProgressStatus;
  }

  if (field === 'phase') {
    return value === null || value === '' ? null : (Number(value) as LivingLabPhase);
  }

  if (field === 'reach_count') {
    return Number(value ?? 0);
  }

  if (field === 'published_date') {
    return value ? String(value) : null;
  }

  return String(value ?? '').trim();
}

function buildChanges(payload: RequestPayload) {
  const changes = payload.changes ?? (payload.field ? { [payload.field]: payload.value } : {});

  return Object.entries(changes).reduce<Record<string, unknown>>((result, [field, value]) => {
    if (!promotionFields.has(field)) {
      return result;
    }

    result[field] = normalizePromotionValue(field, value);
    return result;
  }, {});
}

export async function GET() {
  try {
    seedDb();
    const db = getDb();
    const items = db
      .prepare('SELECT * FROM promotion_records ORDER BY published_date DESC, id DESC')
      .all() as PromotionRecord[];

    return NextResponse.json(items);
  } catch (error) {
    console.error('GET /api/promotion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    seedDb();
    const payload = (await request.json()) as RequestPayload;

    if (typeof payload.id !== 'number') {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const changes = buildChanges(payload);
    const entries = Object.entries(changes);

    if (!entries.length) {
      return NextResponse.json({ error: 'No valid promotion fields provided' }, { status: 400 });
    }

    const db = getDb();
    const setClause = entries.map(([field]) => `${field} = ?`).join(', ');
    db.prepare(`UPDATE promotion_records SET ${setClause} WHERE id = ?`).run(
      ...entries.map(([, value]) => value),
      payload.id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/promotion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
