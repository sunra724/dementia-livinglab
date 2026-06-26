import { NextResponse } from 'next/server';
import { dbQuery } from '@/lib/db';
import { calculatePhaseGateResults } from '@/lib/safety';
import { seedDb } from '@/lib/seed';
import type {
  BudgetItem,
  ChecklistItem,
  KpiItem,
  PromotionRecord,
  Subject,
  Workshop,
} from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ChecklistRow = Omit<ChecklistItem, 'required' | 'completed'> & {
  required: number;
  completed: number;
};

type BudgetRow = Omit<BudgetItem, 'receipt_attached' | 'active'> & {
  receipt_attached: number;
  active: number;
};

type SubjectRow = Omit<Subject, 'consent_signed' | 'participation_phases' | 'dropout'> & {
  consent_signed: number;
  participation_phases: string;
  dropout: number;
};

function parseNumberArray(value: string | null | undefined) {
  if (!value) {
    return [] as number[];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return [] as number[];
    }

    return parsed.filter((item): item is number => typeof item === 'number');
  } catch {
    return [] as number[];
  }
}

function toChecklistItem(row: ChecklistRow): ChecklistItem {
  return {
    ...row,
    required: Boolean(row.required),
    completed: Boolean(row.completed),
  };
}

function toBudgetItem(row: BudgetRow): BudgetItem {
  return {
    ...row,
    receipt_attached: Boolean(row.receipt_attached),
    active: Boolean(row.active),
  };
}

function toSubject(row: SubjectRow): Subject {
  return {
    ...row,
    consent_signed: Boolean(row.consent_signed),
    participation_phases: parseNumberArray(row.participation_phases),
    dropout: Boolean(row.dropout),
  };
}

export async function GET() {
  try {
    await seedDb();

    const kpiItems = await dbQuery<KpiItem>('SELECT * FROM kpi_items ORDER BY category ASC, id ASC');
    const workshops = await dbQuery<Workshop>('SELECT * FROM workshops ORDER BY scheduled_date ASC, id ASC');
    const checklistRows = await dbQuery<ChecklistRow>('SELECT * FROM checklist_items ORDER BY phase ASC, id ASC');
    const promotionItems = await dbQuery<PromotionRecord>(
      'SELECT * FROM promotion_records ORDER BY published_date DESC, id DESC'
    );
    const budgetRows = await dbQuery<BudgetRow>('SELECT * FROM budget_items ORDER BY id ASC');
    const subjectRows = await dbQuery<SubjectRow>('SELECT * FROM subjects ORDER BY code ASC');

    const checklistItems = checklistRows.map(toChecklistItem);
    const safetyChecklistItems = checklistItems.filter((item) => item.category === 'safety');

    return NextResponse.json(
      {
        kpiItems,
        workshopPayload: {
          workshops,
          worksheetEntries: [],
        },
        checklistItems,
        promotionItems,
        budgetItems: budgetRows.map(toBudgetItem),
        safetyData: {
          gate_status: calculatePhaseGateResults(safetyChecklistItems),
        },
        participantsPayload: {
          subjects: subjectRows.map(toSubject),
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('GET /api/dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
