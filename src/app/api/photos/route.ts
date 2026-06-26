import crypto from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { del, put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { dbQuery, dbQueryOne } from '@/lib/db';
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

function hasBlobStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

function isRemotePhoto(filename: string) {
  return filename.startsWith('https://') || filename.startsWith('http://');
}

async function savePhotoFile(file: File, filename: string) {
  if (hasBlobStorage()) {
    const blob = await put(`photos/${filename}`, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    return blob.url;
  }

  const uploadDir = join(process.cwd(), 'public', 'uploads', 'photos');
  await mkdir(uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(join(uploadDir, filename), buffer);
  return filename;
}

async function deletePhotoFile(filename: string) {
  if (isRemotePhoto(filename)) {
    if (hasBlobStorage()) {
      await del(filename).catch(() => undefined);
    }
    return;
  }

  await unlink(join(process.cwd(), 'public', 'uploads', 'photos', filename)).catch(() => undefined);
}

async function resolvePhotoPhase(
  phase: number | null,
  workshopId: number | null,
  worksheetId: number | null
) {
  if (phase && phase >= 1 && phase <= 6) {
    return phase as LivingLabPhase;
  }

  if (workshopId) {
    const row = await dbQueryOne<{ phase: number }>(
      'SELECT phase FROM workshops WHERE id = ? LIMIT 1',
      [workshopId]
    );

    if (row && row.phase >= 1 && row.phase <= 6) {
      return row.phase as LivingLabPhase;
    }
  }

  if (worksheetId) {
    const row = await dbQueryOne<{ phase: number }>(
      `
          SELECT workshops.phase
          FROM worksheet_entries
          JOIN workshops ON workshops.id = worksheet_entries.workshop_id
          WHERE worksheet_entries.id = ?
          LIMIT 1
        `,
      [worksheetId]
    );

    if (row && row.phase >= 1 && row.phase <= 6) {
      return row.phase as LivingLabPhase;
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    await seedDb();
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
    const rows = await dbQuery<FieldPhotoRow>(
      `SELECT * FROM field_photos ${whereClause} ORDER BY created_at DESC, id DESC`,
      values
    );

    return NextResponse.json({ photos: rows.map(toFieldPhoto) });
  } catch (error) {
    console.error('GET /api/photos error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await seedDb();
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

    const extension = extname(file.name) || '.jpg';
    const filename = `${crypto.randomUUID()}${extension}`;
    const storedFilename = await savePhotoFile(file, filename);

    const createdAt = new Date().toISOString();
    const takenAt = takenAtRaw || null;
    const row = await dbQueryOne<FieldPhotoRow>(
      `
          INSERT INTO field_photos (
            workshop_id, worksheet_id, phase, filename, original_name,
            description, taken_by, taken_at, consent_verified, created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          RETURNING *
        `,
      [
        workshopId,
        worksheetId,
        resolvedPhase,
        storedFilename,
        file.name,
        description,
        takenBy,
        takenAt,
        consentVerified ? 1 : 0,
        createdAt
      ]
    );

    return NextResponse.json({
      photo: row ? toFieldPhoto(row) : null,
      url: storedFilename,
    });
  } catch (error) {
    console.error('POST /api/photos error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await seedDb();
    const payload = (await request.json()) as UpdatePhotoPayload;

    if (typeof payload.id !== 'number') {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await dbQuery('UPDATE field_photos SET consent_verified = ? WHERE id = ?', [
      payload.consent_verified ? 1 : 0,
      payload.id,
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/photos error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await seedDb();
    const payload = (await request.json()) as DeletePhotoPayload;

    if (typeof payload.id !== 'number') {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const row = await dbQueryOne<{ filename: string }>(
      'SELECT filename FROM field_photos WHERE id = ? LIMIT 1',
      [payload.id]
    );

    if (!row) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    await dbQuery('DELETE FROM field_photos WHERE id = ?', [payload.id]);
    await deletePhotoFile(row.filename);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/photos error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
