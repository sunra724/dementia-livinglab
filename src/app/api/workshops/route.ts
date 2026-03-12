import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { seedDb } from '@/lib/seed';
import type {
  LivingLabPhase,
  ProgressStatus,
  Workshop,
  WorksheetContributorRole,
  WorksheetEntry,
  WorksheetTemplateKey,
  WorkshopType,
} from '@/lib/types';

export const runtime = 'nodejs';

type WorksheetRow = Omit<WorksheetEntry, 'reviewed'> & { reviewed: number };

type RequestPayload = {
  action?: 'update_workshop' | 'update_worksheet';
  id?: number;
  field?: string;
  value?: unknown;
  changes?: Record<string, unknown>;
};

const workshopFields = new Set([
  'title',
  'type',
  'phase',
  'scheduled_date',
  'actual_date',
  'location',
  'facilitator_id',
  'participants_count',
  'status',
  'description',
  'outcome_summary',
]);

const worksheetFields = new Set([
  'token_id',
  'workshop_id',
  'template_key',
  'group_name',
  'filled_by_name',
  'filled_by_role',
  'content_json',
  'submitted_at',
  'reviewed',
  'reviewed_by',
  'reviewed_at',
  'review_note',
]);

function toWorksheetEntry(row: WorksheetRow): WorksheetEntry {
  return {
    ...row,
    reviewed: Boolean(row.reviewed),
  };
}

function normalizeWorkshopValue(field: string, value: unknown) {
  if (field === 'type') {
    return String(value) as WorkshopType;
  }

  if (field === 'phase') {
    return Number(value) as LivingLabPhase;
  }

  if (field === 'facilitator_id') {
    return value === null || value === '' ? null : Number(value);
  }

  if (field === 'participants_count') {
    return Number(value ?? 0);
  }

  if (field === 'status') {
    return String(value) as ProgressStatus;
  }

  if (field === 'actual_date') {
    return value ? String(value) : null;
  }

  return String(value ?? '').trim();
}

function normalizeWorksheetValue(field: string, value: unknown) {
  if (field === 'token_id' || field === 'workshop_id') {
    return value === null || value === '' ? null : Number(value);
  }

  if (field === 'template_key') {
    return String(value) as WorksheetTemplateKey;
  }

  if (field === 'filled_by_role') {
    return String(value) as WorksheetContributorRole;
  }

  if (field === 'reviewed') {
    return value ? 1 : 0;
  }

  if (field === 'submitted_at' || field === 'reviewed_at') {
    return value ? String(value) : null;
  }

  return String(value ?? '');
}

function buildChanges(
  fields: Set<string>,
  payload: RequestPayload,
  normalizer: (field: string, value: unknown) => unknown
) {
  const changes = payload.changes ?? (payload.field ? { [payload.field]: payload.value } : {});

  return Object.entries(changes).reduce<Record<string, unknown>>((result, [field, value]) => {
    if (!fields.has(field)) {
      return result;
    }

    result[field] = normalizer(field, value);
    return result;
  }, {});
}

export async function GET() {
  try {
    seedDb();
    const db = getDb();
    const workshops = db.prepare('SELECT * FROM workshops ORDER BY scheduled_date ASC, id ASC').all() as Workshop[];
    const worksheetEntries = db
      .prepare('SELECT * FROM worksheet_entries ORDER BY workshop_id ASC, id ASC')
      .all() as WorksheetRow[];

    return NextResponse.json({
      workshops,
      worksheetEntries: worksheetEntries.map(toWorksheetEntry),
    });
  } catch (error) {
    console.error('GET /api/workshops error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    seedDb();
    const payload = (await request.json()) as RequestPayload;

    if (typeof payload.id !== 'number' || !payload.action) {
      return NextResponse.json({ error: 'action and id are required' }, { status: 400 });
    }

    const db = getDb();

    if (payload.action === 'update_workshop') {
      const changes = buildChanges(workshopFields, payload, normalizeWorkshopValue);
      const entries = Object.entries(changes);

      if (!entries.length) {
        return NextResponse.json({ error: 'No valid workshop fields provided' }, { status: 400 });
      }

      const setClause = entries.map(([field]) => `${field} = ?`).join(', ');
      db.prepare(`UPDATE workshops SET ${setClause} WHERE id = ?`).run(
        ...entries.map(([, value]) => value),
        payload.id
      );

      return NextResponse.json({ success: true });
    }

    if (payload.action === 'update_worksheet') {
      const changes = buildChanges(worksheetFields, payload, normalizeWorksheetValue);
      const entries = Object.entries(changes);

      if (!entries.length) {
        return NextResponse.json({ error: 'No valid worksheet fields provided' }, { status: 400 });
      }

      const setClause = entries.map(([field]) => `${field} = ?`).join(', ');
      db.prepare(`UPDATE worksheet_entries SET ${setClause} WHERE id = ?`).run(
        ...entries.map(([, value]) => value),
        payload.id
      );

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('PUT /api/workshops error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
