import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { seedDb } from '@/lib/seed';
import type { BudgetCategory, BudgetItem, LivingLabPhase } from '@/lib/types';

export const runtime = 'nodejs';

type BudgetRow = Omit<BudgetItem, 'receipt_attached' | 'active'> & {
  receipt_attached: number;
  active: number;
};

type RequestPayload = {
  id?: number;
  field?: string;
  value?: unknown;
  changes?: Record<string, unknown>;
};

const budgetFields = new Set([
  'category',
  'item_name',
  'planned_amount',
  'actual_amount',
  'payment_date',
  'payee',
  'receipt_attached',
  'phase',
  'active',
  'notes',
]);

function toBudgetItem(row: BudgetRow): BudgetItem {
  return {
    ...row,
    receipt_attached: Boolean(row.receipt_attached),
    active: Boolean(row.active),
  };
}

function normalizeBudgetValue(field: string, value: unknown) {
  if (field === 'category') {
    return String(value) as BudgetCategory;
  }

  if (field === 'planned_amount' || field === 'actual_amount') {
    return Number(value ?? 0);
  }

  if (field === 'receipt_attached' || field === 'active') {
    return value ? 1 : 0;
  }

  if (field === 'phase') {
    return value === null || value === '' ? null : (Number(value) as LivingLabPhase);
  }

  if (field === 'payment_date') {
    return value ? String(value) : null;
  }

  return String(value ?? '').trim();
}

function buildChanges(payload: RequestPayload) {
  const changes = payload.changes ?? (payload.field ? { [payload.field]: payload.value } : {});

  return Object.entries(changes).reduce<Record<string, unknown>>((result, [field, value]) => {
    if (!budgetFields.has(field)) {
      return result;
    }

    result[field] = normalizeBudgetValue(field, value);
    return result;
  }, {});
}

export async function GET() {
  try {
    seedDb();
    const db = getDb();
    const items = db.prepare('SELECT * FROM budget_items ORDER BY id ASC').all() as BudgetRow[];

    return NextResponse.json(items.map(toBudgetItem));
  } catch (error) {
    console.error('GET /api/budget error:', error);
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
      return NextResponse.json({ error: 'No valid budget fields provided' }, { status: 400 });
    }

    const db = getDb();
    const setClause = entries.map(([field]) => `${field} = ?`).join(', ');
    db.prepare(`UPDATE budget_items SET ${setClause} WHERE id = ?`).run(
      ...entries.map(([, value]) => value),
      payload.id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/budget error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
