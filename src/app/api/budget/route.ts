import { NextRequest, NextResponse } from 'next/server';
import { dbQuery, dbQueryOne, updateById, type DbValue } from '@/lib/db';
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
  data?: Partial<BudgetItem>;
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

function normalizeBudgetValue(field: string, value: unknown): DbValue {
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

  return Object.entries(changes).reduce<Record<string, DbValue>>((result, [field, value]) => {
    if (!budgetFields.has(field)) {
      return result;
    }

    result[field] = normalizeBudgetValue(field, value);
    return result;
  }, {});
}

export async function GET() {
  try {
    await seedDb();
    const items = await dbQuery<BudgetRow>('SELECT * FROM budget_items ORDER BY id ASC');

    return NextResponse.json(items.map(toBudgetItem));
  } catch (error) {
    console.error('GET /api/budget error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await seedDb();
    const payload = (await request.json()) as RequestPayload;
    const data = payload.data ?? {};
    const category = String(data.category ?? '').trim();
    const itemName = String(data.item_name ?? '').trim();
    const payee = String(data.payee ?? '').trim();

    if (!category || !itemName || !payee) {
      return NextResponse.json({ error: 'category, item_name and payee are required' }, { status: 400 });
    }

    const item = await dbQueryOne<BudgetRow>(
      `
          INSERT INTO budget_items (
            category, item_name, planned_amount, actual_amount, payment_date,
            payee, receipt_attached, phase, active, notes
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          RETURNING *
        `,
      [
        category,
        itemName,
        Number(data.planned_amount ?? 0),
        Number(data.actual_amount ?? 0),
        data.payment_date ? String(data.payment_date) : null,
        payee,
        data.receipt_attached ? 1 : 0,
        data.phase === null || data.phase === undefined ? null : Number(data.phase),
        data.active === undefined ? 1 : data.active ? 1 : 0,
        String(data.notes ?? '').trim()
      ]
    );

    return NextResponse.json({ item: item ? toBudgetItem(item) : null });
  } catch (error) {
    console.error('POST /api/budget error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await seedDb();
    const payload = (await request.json()) as RequestPayload;

    if (typeof payload.id !== 'number') {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const changes = buildChanges(payload);
    const entries = Object.entries(changes);

    if (!entries.length) {
      return NextResponse.json({ error: 'No valid budget fields provided' }, { status: 400 });
    }

    await updateById('budget_items', payload.id, changes);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/budget error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await seedDb();
    const payload = (await request.json()) as { id?: number };

    if (typeof payload.id !== 'number') {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await dbQuery('DELETE FROM budget_items WHERE id = ?', [payload.id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/budget error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
