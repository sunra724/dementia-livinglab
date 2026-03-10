import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { seedDb } from '@/lib/seed';

export const runtime = 'nodejs';

function escapeCsv(value: unknown) {
  const stringValue = String(value ?? '');
  return /[",\n]/.test(stringValue) ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
}

function toCsv(headers: string[], rows: Array<Record<string, unknown>>) {
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(',')),
  ];

  return lines.join('\n');
}

export async function GET(request: NextRequest) {
  try {
    seedDb();
    const type = request.nextUrl.searchParams.get('type');
    const db = getDb();

    if (type === 'kpi') {
      const rows = db.prepare('SELECT * FROM kpi_items ORDER BY id ASC').all() as Array<Record<string, unknown>>;
      const headers = ['id', 'category', 'indicator', 'target', 'current', 'unit', 'trend', 'phase_related', 'notes'];
      const csv = toCsv(headers, rows);

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="kpi-export.csv"',
        },
      });
    }

    if (type === 'budget') {
      const rows = db.prepare('SELECT * FROM budget_items ORDER BY id ASC').all() as Array<Record<string, unknown>>;
      const headers = [
        'id',
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
      ];
      const csv = toCsv(headers, rows);

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="budget-export.csv"',
        },
      });
    }

    if (type === 'participants') {
      const participantRows = db.prepare('SELECT * FROM participants ORDER BY id ASC').all() as Array<Record<string, unknown>>;
      const institutionRows = db.prepare('SELECT * FROM institutions ORDER BY id ASC').all() as Array<Record<string, unknown>>;
      const subjectRows = db.prepare('SELECT * FROM subjects ORDER BY id ASC').all() as Array<Record<string, unknown>>;

      const rows = [
        ...participantRows.map((row) => ({ record_type: 'participant', ...row })),
        ...institutionRows.map((row) => ({ record_type: 'institution', ...row })),
        ...subjectRows.map((row) => ({ record_type: 'subject', ...row })),
      ];
      const headers = [
        'record_type',
        'id',
        'name',
        'role',
        'affiliation',
        'contact',
        'joined_date',
        'active',
        'type',
        'representative',
        'contact_person',
        'address',
        'mou_signed',
        'mou_date',
        'participating_phases',
        'code',
        'dementia_stage',
        'age_group',
        'institution_id',
        'consent_signed',
        'participation_phases',
        'dropout',
        'dropout_reason',
        'notes',
      ];
      const csv = toCsv(headers, rows);

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="participants-export.csv"',
        },
      });
    }

    return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
  } catch (error) {
    console.error('GET /api/export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
