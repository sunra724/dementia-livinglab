import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { seedDb } from '@/lib/seed';
import { calculatePhaseGateResults } from '@/lib/safety';
import type {
  ChecklistItem,
  FieldPhoto,
  LivingLabPhase,
  SafetyLog,
  SafetyLogType,
  SafetySeverity,
} from '@/lib/types';

export const runtime = 'nodejs';

type ChecklistRow = Omit<ChecklistItem, 'required' | 'completed'> & {
  required: number;
  completed: number;
};

type SafetyLogRow = Omit<SafetyLog, 'resolved'> & {
  resolved: number;
};

type FieldPhotoRow = Omit<FieldPhoto, 'consent_verified'> & {
  consent_verified: number;
};

type CreateSafetyLogPayload = {
  phase: number;
  workshop_id?: number;
  log_type: SafetyLogType;
  description: string;
  recorder: string;
  severity: SafetySeverity;
};

type ResolveSafetyLogPayload = {
  id: number;
  resolved_note: string;
};

function toChecklistItem(row: ChecklistRow): ChecklistItem {
  return {
    ...row,
    required: Boolean(row.required),
    completed: Boolean(row.completed),
  };
}

function toSafetyLog(row: SafetyLogRow): SafetyLog {
  return {
    ...row,
    resolved: Boolean(row.resolved),
  };
}

function toFieldPhoto(row: FieldPhotoRow): FieldPhoto {
  return {
    ...row,
    consent_verified: Boolean(row.consent_verified),
  };
}

function isLivingLabPhase(value: number): value is LivingLabPhase {
  return value >= 1 && value <= 6;
}

function isSafetyLogType(value: string): value is SafetyLogType {
  return ['consent', 'anonymization', 'incident', 'stop_criterion'].includes(value);
}

function isSafetySeverity(value: string): value is SafetySeverity {
  return ['info', 'warning', 'critical'].includes(value);
}

export async function GET() {
  try {
    seedDb();
    const db = getDb();

    const logRows = db
      .prepare('SELECT * FROM safety_logs ORDER BY created_at DESC, id DESC')
      .all() as SafetyLogRow[];
    const safetyChecklistRows = db
      .prepare("SELECT * FROM checklist_items WHERE category = 'safety' ORDER BY phase ASC, id ASC")
      .all() as ChecklistRow[];
    const photoRows = db
      .prepare('SELECT * FROM field_photos ORDER BY created_at DESC, id DESC')
      .all() as FieldPhotoRow[];

    const checklistSafety = safetyChecklistRows.map(toChecklistItem);

    return NextResponse.json({
      logs: logRows.map(toSafetyLog),
      checklist_safety: checklistSafety,
      gate_status: calculatePhaseGateResults(checklistSafety),
      photos: photoRows.map(toFieldPhoto),
    });
  } catch (error) {
    console.error('GET /api/safety error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    seedDb();
    const payload = (await request.json()) as CreateSafetyLogPayload;
    const phase = Number(payload.phase);
    const description = String(payload.description ?? '').trim();
    const recorder = String(payload.recorder ?? '').trim();
    const logType = String(payload.log_type ?? '');
    const severity = String(payload.severity ?? '');

    if (
      !isLivingLabPhase(phase) ||
      !isSafetyLogType(logType) ||
      !isSafetySeverity(severity) ||
      description.length === 0 ||
      recorder.length === 0
    ) {
      return NextResponse.json({ error: 'Invalid safety log payload' }, { status: 400 });
    }

    const workshopId =
      typeof payload.workshop_id === 'number' && Number.isFinite(payload.workshop_id)
        ? payload.workshop_id
        : null;

    const db = getDb();
    const result = db
      .prepare(
        `
          INSERT INTO safety_logs (
            phase, workshop_id, log_type, description, recorder, severity, resolved, resolved_note, created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, 0, '', ?)
        `
      )
      .run(phase, workshopId, logType, description, recorder, severity, new Date().toISOString());

    const row = db
      .prepare('SELECT * FROM safety_logs WHERE id = ? LIMIT 1')
      .get(result.lastInsertRowid) as SafetyLogRow | undefined;

    return NextResponse.json({ log: row ? toSafetyLog(row) : null });
  } catch (error) {
    console.error('POST /api/safety error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    seedDb();
    const payload = (await request.json()) as ResolveSafetyLogPayload;
    const resolvedNote = String(payload.resolved_note ?? '').trim();

    if (typeof payload.id !== 'number' || resolvedNote.length === 0) {
      return NextResponse.json({ error: 'Invalid safety log resolution payload' }, { status: 400 });
    }

    const db = getDb();
    db.prepare(
      `
        UPDATE safety_logs
        SET resolved = 1,
            resolved_note = ?
        WHERE id = ?
      `
    ).run(resolvedNote, payload.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/safety error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
