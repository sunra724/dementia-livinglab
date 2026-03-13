import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { seedDb } from '@/lib/seed';
import type { KpiItem, LivingLabPhase } from '@/lib/types';

export const runtime = 'nodejs';

type RequestPayload = {
  id?: number;
  field?: string;
  value?: unknown;
  changes?: Record<string, unknown>;
  data?: Partial<KpiItem>;
};

const kpiFields = new Set(['category', 'indicator', 'target', 'current', 'unit', 'trend', 'phase_related', 'notes']);

function normalizeKpiValue(field: string, value: unknown) {
  if (field === 'target' || field === 'current') {
    return Number(value ?? 0);
  }

  if (field === 'phase_related') {
    return value === null || value === '' ? null : (Number(value) as LivingLabPhase);
  }

  return String(value ?? '').trim();
}

function buildChanges(payload: RequestPayload) {
  const changes = payload.changes ?? (payload.field ? { [payload.field]: payload.value } : {});

  return Object.entries(changes).reduce<Record<string, unknown>>((result, [field, value]) => {
    if (!kpiFields.has(field)) {
      return result;
    }

    result[field] = normalizeKpiValue(field, value);
    return result;
  }, {});
}

export async function GET() {
  try {
    seedDb();
    const db = getDb();
    const items = db.prepare('SELECT * FROM kpi_items ORDER BY category ASC, id ASC').all() as KpiItem[];

    return NextResponse.json(items);
  } catch (error) {
    console.error('GET /api/kpi error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    seedDb();
    const payload = (await request.json()) as RequestPayload;
    const data = payload.data ?? {};
    const category = String(data.category ?? '').trim();
    const indicator = String(data.indicator ?? '').trim();
    const unit = String(data.unit ?? '').trim();
    const trend = String(data.trend ?? 'stable').trim();

    if (!category || !indicator || !unit || !trend) {
      return NextResponse.json({ error: 'category, indicator, unit and trend are required' }, { status: 400 });
    }

    const target = Number(data.target ?? 0);
    const current = Number(data.current ?? 0);
    const rawPhaseRelated = data.phase_related;
    const phaseRelated =
      rawPhaseRelated === null || rawPhaseRelated === undefined ? null : Number(rawPhaseRelated);
    const notes = String(data.notes ?? '').trim();

    const db = getDb();
    const result = db
      .prepare(
        `
          INSERT INTO kpi_items (category, indicator, target, current, unit, trend, phase_related, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `
      )
      .run(category, indicator, target, current, unit, trend, phaseRelated, notes);

    const item = db.prepare('SELECT * FROM kpi_items WHERE id = ?').get(result.lastInsertRowid) as KpiItem | undefined;
    return NextResponse.json({ item });
  } catch (error) {
    console.error('POST /api/kpi error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    seedDb();
    const db = getDb();
    const payload = (await request.json()) as RequestPayload;

    if (typeof payload.id !== 'number') {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const changes = buildChanges(payload);
    const entries = Object.entries(changes);

    if (!entries.length) {
      return NextResponse.json({ error: 'No valid KPI fields provided' }, { status: 400 });
    }

    const setClause = entries.map(([field]) => `${field} = ?`).join(', ');
    db.prepare(`UPDATE kpi_items SET ${setClause} WHERE id = ?`).run(
      ...entries.map(([, value]) => value),
      payload.id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/kpi error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    seedDb();
    const payload = (await request.json()) as { id?: number };

    if (typeof payload.id !== 'number') {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const db = getDb();
    db.prepare('DELETE FROM kpi_items WHERE id = ?').run(payload.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/kpi error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
