import { NextRequest, NextResponse } from 'next/server';
import { dbQuery, dbQueryOne, updateById, type DbValue } from '@/lib/db';
import { seedDb } from '@/lib/seed';
import type {
  DementiaStage,
  Institution,
  InstitutionType,
  Participant,
  RoleType,
  Subject,
  SubjectType,
} from '@/lib/types';

export const runtime = 'nodejs';

type ParticipantRow = Omit<Participant, 'active'> & { active: number };
type InstitutionRow = Omit<Institution, 'mou_signed' | 'participating_phases'> & {
  mou_signed: number;
  participating_phases: string;
};
type SubjectRow = Omit<Subject, 'consent_signed' | 'participation_phases' | 'dropout'> & {
  consent_signed: number;
  participation_phases: string;
  dropout: number;
};

type RequestPayload = {
  action?: string;
  type?: 'participant' | 'institution' | 'subject';
  id?: number;
  field?: string;
  value?: unknown;
  table?: string;
  data?: Record<string, unknown>;
  changes?: Record<string, unknown>;
};

const participantFields = new Set(['name', 'role', 'affiliation', 'contact', 'joined_date', 'notes']);
const institutionFields = new Set([
  'name',
  'type',
  'representative',
  'contact_person',
  'contact',
  'address',
  'mou_signed',
  'mou_date',
  'participating_phases',
  'notes',
]);
const subjectFields = new Set([
  'type',
  'dementia_stage',
  'age_group',
  'institution_id',
  'consent_signed',
  'participation_phases',
  'dropout',
  'dropout_reason',
  'notes',
]);

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

function toParticipant(row: ParticipantRow): Participant {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    affiliation: row.affiliation,
    contact: row.contact,
    joined_date: row.joined_date,
    active: Boolean(row.active),
    notes: row.notes,
  };
}

function toInstitution(row: InstitutionRow): Institution {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    representative: row.representative,
    contact_person: row.contact_person,
    contact: row.contact,
    address: row.address,
    mou_signed: Boolean(row.mou_signed),
    mou_date: row.mou_date,
    participating_phases: parseNumberArray(row.participating_phases),
    notes: row.notes,
  };
}

function toSubject(row: SubjectRow): Subject {
  return {
    id: row.id,
    code: row.code,
    type: row.type,
    dementia_stage: row.dementia_stage,
    age_group: row.age_group,
    institution_id: row.institution_id,
    consent_signed: Boolean(row.consent_signed),
    participation_phases: parseNumberArray(row.participation_phases),
    dropout: Boolean(row.dropout),
    dropout_reason: row.dropout_reason,
    notes: row.notes,
  };
}

function normalizeParticipantValue(field: string, value: unknown): DbValue {
  if (field === 'role') {
    return String(value) as RoleType;
  }

  return String(value ?? '').trim();
}

function normalizeInstitutionValue(field: string, value: unknown): DbValue {
  if (field === 'mou_signed') {
    return value ? 1 : 0;
  }

  if (field === 'participating_phases') {
    return JSON.stringify(Array.isArray(value) ? value : []);
  }

  if (field === 'type') {
    return String(value) as InstitutionType;
  }

  if (field === 'mou_date') {
    return value ? String(value) : null;
  }

  return String(value ?? '').trim();
}

function normalizeSubjectValue(field: string, value: unknown): DbValue {
  if (field === 'consent_signed' || field === 'dropout') {
    return value ? 1 : 0;
  }

  if (field === 'institution_id') {
    return Number(value);
  }

  if (field === 'participation_phases') {
    return JSON.stringify(Array.isArray(value) ? value : []);
  }

  if (field === 'type') {
    return String(value) as SubjectType;
  }

  if (field === 'dementia_stage') {
    return String(value) as DementiaStage;
  }

  if (field === 'dropout_reason') {
    return value ? String(value).trim() : null;
  }

  return String(value ?? '').trim();
}

function buildChanges(
  allowedFields: Set<string>,
  payload: RequestPayload,
  normalizer: (field: string, value: unknown) => DbValue
) {
  const changes = payload.changes ?? (payload.field ? { [payload.field]: payload.value } : {});

  return Object.entries(changes).reduce<Record<string, DbValue>>((result, [field, value]) => {
    if (!allowedFields.has(field)) {
      return result;
    }

    result[field] = normalizer(field, value);
    return result;
  }, {});
}

async function nextSubjectCode(type: SubjectType) {
  const prefix = type === 'elder' ? 'E' : 'F';
  const row = await dbQueryOne<{ code: string }>(
    'SELECT code FROM subjects WHERE code LIKE ? ORDER BY code DESC LIMIT 1',
    [`${prefix}%`]
  );

  if (!row) {
    return `${prefix}001`;
  }

  const sequence = Number(row.code.slice(1)) + 1;
  return `${prefix}${String(sequence).padStart(3, '0')}`;
}

export async function GET() {
  try {
    await seedDb();

    const activists = await dbQuery<ParticipantRow>(
      `
          SELECT * FROM participants
          WHERE active = 1 AND role IN ('activist', 'facilitator', 'expert')
          ORDER BY joined_date ASC, id ASC
        `
    );

    const institutionStaffs = await dbQuery<ParticipantRow>(
      `
          SELECT * FROM participants
          WHERE active = 1 AND role = 'institution_staff'
          ORDER BY joined_date ASC, id ASC
        `
    );

    const institutions = await dbQuery<InstitutionRow>('SELECT * FROM institutions ORDER BY id ASC');

    const subjects = await dbQuery<SubjectRow>('SELECT * FROM subjects ORDER BY code ASC');

    return NextResponse.json({
      activists: activists.map(toParticipant),
      institution_staffs: institutionStaffs.map(toParticipant),
      institutions: institutions.map(toInstitution),
      subjects: subjects.map(toSubject),
    });
  } catch (error) {
    console.error('GET /api/participants error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await seedDb();
    const payload = (await request.json()) as RequestPayload;

    if (!payload.action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 });
    }

    switch (payload.action) {
      case 'update_participant': {
        if (typeof payload.id !== 'number') {
          return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        const changes = buildChanges(participantFields, payload, normalizeParticipantValue);
        const updated = await updateById('participants', payload.id, changes);

        if (!updated) {
          return NextResponse.json({ error: 'No valid participant fields provided' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
      }

      case 'toggle_active': {
        if (typeof payload.id !== 'number') {
          return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        const current = await dbQueryOne<{ active: number }>(
          'SELECT active FROM participants WHERE id = ?',
          [payload.id]
        );

        if (!current) {
          return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
        }

        await dbQuery('UPDATE participants SET active = ? WHERE id = ?', [
          current.active ? 0 : 1,
          payload.id,
        ]);
        return NextResponse.json({ success: true });
      }

      case 'update_institution': {
        if (typeof payload.id !== 'number') {
          return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        const changes = buildChanges(institutionFields, payload, normalizeInstitutionValue);
        const updated = await updateById('institutions', payload.id, changes);

        if (!updated) {
          return NextResponse.json({ error: 'No valid institution fields provided' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
      }

      case 'update_subject': {
        if (typeof payload.id !== 'number') {
          return NextResponse.json({ error: 'id is required' }, { status: 400 });
        }

        const changes = buildChanges(subjectFields, payload, normalizeSubjectValue);
        const updated = await updateById('subjects', payload.id, changes);

        if (!updated) {
          return NextResponse.json({ error: 'No valid subject fields provided' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('PUT /api/participants error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await seedDb();
    const payload = (await request.json()) as RequestPayload;

    if (!payload.type || !payload.data) {
      return NextResponse.json({ error: 'type and data are required' }, { status: 400 });
    }

    if (payload.type === 'participant') {
      const data = payload.data;
      await dbQuery(
        `
          INSERT INTO participants (name, role, affiliation, contact, joined_date, active, notes)
          VALUES (?, ?, ?, ?, ?, 1, ?)
        `,
        [
          String(data.name ?? '').trim(),
          String(data.role ?? 'activist'),
          String(data.affiliation ?? '').trim(),
          String(data.contact ?? '').trim(),
          String(data.joined_date ?? ''),
          String(data.notes ?? '').trim(),
        ]
      );

      return NextResponse.json({ success: true });
    }

    if (payload.type === 'institution') {
      const data = payload.data;
      await dbQuery(
        `
          INSERT INTO institutions (
            name, type, representative, contact_person, contact,
            address, mou_signed, mou_date, participating_phases, notes
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          String(data.name ?? '').trim(),
          String(data.type ?? 'other'),
          String(data.representative ?? '').trim(),
          String(data.contact_person ?? '').trim(),
          String(data.contact ?? '').trim(),
          String(data.address ?? '').trim(),
          data.mou_signed ? 1 : 0,
          data.mou_date ? String(data.mou_date) : null,
          JSON.stringify(Array.isArray(data.participating_phases) ? data.participating_phases : []),
          String(data.notes ?? '').trim(),
        ]
      );

      return NextResponse.json({ success: true });
    }

    const subjectType = String(payload.data.type ?? 'elder') as SubjectType;
    const code = await nextSubjectCode(subjectType);

    await dbQuery(
      `
        INSERT INTO subjects (
          code, type, dementia_stage, age_group, institution_id,
          consent_signed, participation_phases, dropout, dropout_reason, notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        code,
        subjectType,
        String(payload.data.dementia_stage ?? 'unknown'),
        String(payload.data.age_group ?? '').trim(),
        Number(payload.data.institution_id ?? 1),
        payload.data.consent_signed ? 1 : 0,
        JSON.stringify(Array.isArray(payload.data.participation_phases) ? payload.data.participation_phases : [1]),
        payload.data.dropout ? 1 : 0,
        payload.data.dropout ? String(payload.data.dropout_reason ?? '').trim() || null : null,
        String(payload.data.notes ?? '').trim(),
      ]
    );

    return NextResponse.json({ success: true, code });
  } catch (error) {
    console.error('POST /api/participants error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
