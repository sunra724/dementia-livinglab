import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { seedDb } from '@/lib/seed';
import type {
  FacilitatorRole,
  FacilitatorRoleAssignment,
  Participant,
  RoleType,
} from '@/lib/types';

export const runtime = 'nodejs';

type ParticipantRow = Omit<Participant, 'active'> & { active: number };

type RoleAssignmentRow = Omit<FacilitatorRoleAssignment, 'participant_name'> & {
  participant_name: string;
};

type CreateAssignmentPayload = {
  workshop_id: number;
  participant_id: number;
  role: FacilitatorRole;
  notes: string;
};

type DeleteAssignmentPayload = {
  id: number;
};

function toParticipant(row: ParticipantRow): Participant {
  return {
    ...row,
    role: row.role as RoleType,
    active: Boolean(row.active),
  };
}

function isFacilitatorRole(value: string): value is FacilitatorRole {
  return ['facilitator', 'recorder', 'safety_officer', 'photographer'].includes(value);
}

export async function GET(request: NextRequest) {
  try {
    seedDb();
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const workshopId = Number(searchParams.get('workshop_id'));

    if (!Number.isFinite(workshopId)) {
      return NextResponse.json({ error: 'workshop_id is required' }, { status: 400 });
    }

    const assignments = db
      .prepare(
        `
          SELECT fr.*, p.name as participant_name
          FROM facilitator_roles fr
          JOIN participants p ON p.id = fr.participant_id
          WHERE fr.workshop_id = ?
          ORDER BY fr.id ASC
        `
      )
      .all(workshopId) as RoleAssignmentRow[];

    const availableParticipants = db
      .prepare(
        `
          SELECT * FROM participants
          WHERE active = 1 AND role IN ('activist', 'facilitator', 'expert')
          ORDER BY joined_date ASC, id ASC
        `
      )
      .all() as ParticipantRow[];

    return NextResponse.json({
      assignments,
      available_participants: availableParticipants.map(toParticipant),
    });
  } catch (error) {
    console.error('GET /api/roles error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    seedDb();
    const payload = (await request.json()) as CreateAssignmentPayload;
    const workshopId = Number(payload.workshop_id);
    const participantId = Number(payload.participant_id);
    const role = String(payload.role ?? '');
    const notes = String(payload.notes ?? '').trim();

    if (!Number.isFinite(workshopId) || !Number.isFinite(participantId) || !isFacilitatorRole(role)) {
      return NextResponse.json({ error: 'Invalid role assignment payload' }, { status: 400 });
    }

    const db = getDb();
    db.prepare('DELETE FROM facilitator_roles WHERE workshop_id = ? AND role = ?').run(workshopId, role);
    db.prepare(
      `
        INSERT OR REPLACE INTO facilitator_roles (workshop_id, participant_id, role, notes)
        VALUES (?, ?, ?, ?)
      `
    ).run(workshopId, participantId, role, notes);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/roles error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    seedDb();
    const payload = (await request.json()) as DeleteAssignmentPayload;

    if (typeof payload.id !== 'number') {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const db = getDb();
    db.prepare('DELETE FROM facilitator_roles WHERE id = ?').run(payload.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/roles error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
