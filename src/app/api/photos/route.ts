import crypto from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { seedDb } from '@/lib/seed';
import type { FieldPhoto, LivingLabPhase } from '@/lib/types';

export const runtime = 'nodejs';

type FieldPhotoRow = Omit<FieldPhoto, 'consent_verified'> & {
  consent_verified: number;
};

type DeletePhotoPayload = {
  id: number;
};

type UpdatePhotoPayload = {
  id: number;
  consent_verified: boolean;
};

function toFieldPhoto(row: FieldPhotoRow): FieldPhoto {
  return {
    ...row,
    consent_verified: Boolean(row.consent_verified),
  };
}

function parseNullableNumber(value: FormDataEntryValue | null) {
  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseNullableString(value: FormDataEntryValue | null) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

async function resolvePhotoPhase(
  phase: number | null,
  workshopId: number | null,
  worksheetId: number | null
) {
  if (phase && phase >= 1 && phase <= 6) {
    return phase as LivingLabPhase;
  }

  const db = getDb();

  if (workshopId) {
    const row = db
      .prepare('SELECT phase FROM workshops WHERE id = ? LIMIT 1')
      .get(workshopId) as { phase: number } | undefined;

    if (row && row.phase >= 1 && row.phase <= 6) {
      return row.phase as LivingLabPhase;
    }
  }

  if (worksheetId) {
    const row = db
      .prepare(
        `
          SELECT workshops.phase
          FROM worksheet_entries
          JOIN workshops ON workshops.id = worksheet_entries.workshop_id
          WHERE worksheet_entries.id = ?
          LIMIT 1
        `
      )
      .get(worksheetId) as { phase: number } | undefined;

    if (row && row.phase >= 1 && row.phase <= 6) {
      return row.phase as LivingLabPhase;
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    seedDb();
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const workshopId = searchParams.get('workshop_id');
    const worksheetId = searchParams.get('worksheet_id');
    const phase = searchParams.get('phase');

    const clauses: string[] = [];
    const values: Array<number> = [];

    if (workshopId) {
      clauses.push('workshop_id = ?');
      values.push(Number(workshopId));
    }

    if (worksheetId) {
      clauses.push('worksheet_id = ?');
      values.push(Number(worksheetId));
    }

    if (phase) {
      clauses.push('phase = ?');
      values.push(Number(phase));
    }

    const whereClause = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const rows = db
      .prepare(`SELECT * FROM field_photos ${whereClause} ORDER BY created_at DESC, id DESC`)
      .all(...values) as FieldPhotoRow[];

    return NextResponse.json({ photos: rows.map(toFieldPhoto) });
  } catch (error) {
    console.error('GET /api/photos error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    seedDb();
    const db = getDb();
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be 10MB or smaller' }, { status: 400 });
    }

    const workshopId = parseNullableNumber(formData.get('workshop_id'));
    const worksheetId = parseNullableNumber(formData.get('worksheet_id'));
    const phase = parseNullableNumber(formData.get('phase'));
    const description = parseNullableString(formData.get('description'));
    const takenBy = parseNullableString(formData.get('taken_by'));
    const takenAtRaw = parseNullableString(formData.get('taken_at'));
    const consentVerified = String(formData.get('consent_verified') ?? '') === 'true';
    const resolvedPhase = await resolvePhotoPhase(phase, workshopId, worksheetId);

    const uploadDir = join(process.cwd(), 'public', 'uploads', 'photos');
    await mkdir(uploadDir, { recursive: true });

    const extension = extname(file.name) || '.jpg';
    const filename = `${crypto.randomUUID()}${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(uploadDir, filename), buffer);

    const createdAt = new Date().toISOString();
    const takenAt = takenAtRaw || null;
    const result = db
      .prepare(
        `
          INSERT INTO field_photos (
            workshop_id, worksheet_id, phase, filename, original_name,
            description, taken_by, taken_at, consent_verified, created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
      )
      .run(
        workshopId,
        worksheetId,
        resolvedPhase,
        filename,
        file.name,
        description,
        takenBy,
        takenAt,
        consentVerified ? 1 : 0,
        createdAt
      );

    const row = db
      .prepare('SELECT * FROM field_photos WHERE id = ? LIMIT 1')
      .get(result.lastInsertRowid) as FieldPhotoRow | undefined;

    return NextResponse.json({
      photo: row ? toFieldPhoto(row) : null,
      url: `/uploads/photos/${filename}`,
    });
  } catch (error) {
    console.error('POST /api/photos error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    seedDb();
    const payload = (await request.json()) as UpdatePhotoPayload;

    if (typeof payload.id !== 'number') {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const db = getDb();
    db.prepare('UPDATE field_photos SET consent_verified = ? WHERE id = ?').run(
      payload.consent_verified ? 1 : 0,
      payload.id
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/photos error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    seedDb();
    const payload = (await request.json()) as DeletePhotoPayload;

    if (typeof payload.id !== 'number') {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const db = getDb();
    const row = db
      .prepare('SELECT filename FROM field_photos WHERE id = ? LIMIT 1')
      .get(payload.id) as { filename: string } | undefined;

    if (!row) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    db.prepare('DELETE FROM field_photos WHERE id = ?').run(payload.id);
    await unlink(join(process.cwd(), 'public', 'uploads', 'photos', row.filename)).catch(() => undefined);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/photos error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
