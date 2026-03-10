import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { seedDb } from '@/lib/seed';
import type { ChecklistItem, LivingLabPhase } from '@/lib/types';

export const runtime = 'nodejs';

type ChecklistRow = Omit<ChecklistItem, 'required' | 'completed'> & {
  required: number;
  completed: number;
};

type RequestPayload = {
  id?: number;
  field?: string;
  value?: unknown;
  changes?: Record<string, unknown>;
};

const checklistFields = new Set([
  'phase',
  'category',
  'title',
  'description',
  'required',
  'completed',
  'completed_date',
  'completed_by',
  'evidence_note',
]);

function toChecklistItem(row: ChecklistRow): ChecklistItem {
  return {
    ...row,
    required: Boolean(row.required),
    completed: Boolean(row.completed),
  };
}

function normalizeChecklistValue(field: string, value: unknown, previous: Record<string, unknown>) {
  if (field === 'phase') {
    return Number(value) as LivingLabPhase;
  }

  if (field === 'required') {
    return value ? 1 : 0;
  }

  if (field === 'completed') {
    if (value) {
      return 1;
    }

    return 0;
  }

  if (field === 'completed_date') {
    if (value === undefined && previous.completed) {
      return new Date().toISOString().slice(0, 10);
    }

    return value ? String(value) : null;
  }

  if (field === 'completed_by') {
    return value ? String(value).trim() : null;
  }

  return String(value ?? '').trim();
}

function buildChanges(payload: RequestPayload) {
  const changes = payload.changes ?? (payload.field ? { [payload.field]: payload.value } : {});
  const nextChanges = Object.entries(changes).reduce<Record<string, unknown>>((result, [field, value]) => {
    if (!checklistFields.has(field)) {
      return result;
    }

    result[field] = value;
    return result;
  }, {});

  if ('completed' in nextChanges && !('completed_date' in nextChanges)) {
    nextChanges.completed_date = nextChanges.completed ? new Date().toISOString().slice(0, 10) : null;
  }

  return nextChanges;
}

export async function GET() {
  try {
    seedDb();
    const db = getDb();
    const items = db.prepare('SELECT * FROM checklist_items ORDER BY phase ASC, id ASC').all() as ChecklistRow[];

    return NextResponse.json(items.map(toChecklistItem));
  } catch (error) {
    console.error('GET /api/guidebook error:', error);
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

    const rawChanges = buildChanges(payload);
    const entries = Object.entries(rawChanges);

    if (!entries.length) {
      return NextResponse.json({ error: 'No valid guidebook fields provided' }, { status: 400 });
    }

    const normalizedEntries = entries.map(([field, value]) => [field, normalizeChecklistValue(field, value, rawChanges)] as const);
    const db = getDb();
    const setClause = normalizedEntries.map(([field]) => `${field} = ?`).join(', ');
    db.prepare(`UPDATE checklist_items SET ${setClause} WHERE id = ?`).run(
      ...normalizedEntries.map(([, value]) => value),
      payload.id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/guidebook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
