import { readFile } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import { get } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { recordAdminAudit } from '@/lib/audit';
import { dbQueryOne } from '@/lib/db';

export const runtime = 'nodejs';

interface PhotoFileRow {
  filename: string;
}

const contentTypes: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

function noStoreHeaders(contentType: string) {
  return {
    'Cache-Control': 'private, no-store, max-age=0',
    'Content-Type': contentType,
    'X-Content-Type-Options': 'nosniff',
  };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await recordAdminAudit(request, 'photo_file');
  const { id } = await context.params;
  const photoId = Number(id);

  if (!Number.isInteger(photoId) || photoId < 1) {
    return NextResponse.json({ error: 'Invalid photo id' }, { status: 400 });
  }

  const row = await dbQueryOne<PhotoFileRow>(
    'SELECT filename FROM field_photos WHERE id = ? LIMIT 1',
    [photoId]
  );

  if (!row) {
    return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
  }

  if (row.filename.startsWith('https://') || row.filename.startsWith('http://')) {
    const blob = await get(row.filename, { access: 'public' });

    if (!blob || blob.statusCode === 304 || !blob.stream) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    return new NextResponse(blob.stream, {
      headers: noStoreHeaders(blob.blob.contentType || 'application/octet-stream'),
    });
  }

  if (row.filename.startsWith('photos/')) {
    const blob = await get(row.filename, { access: 'private' });

    if (!blob || blob.statusCode === 304 || !blob.stream) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    return new NextResponse(blob.stream, {
      headers: noStoreHeaders(blob.blob.contentType || 'application/octet-stream'),
    });
  }

  if (basename(row.filename) !== row.filename) {
    return NextResponse.json({ error: 'Invalid photo path' }, { status: 400 });
  }

  try {
    const buffer = await readFile(
      join(process.cwd(), 'data', 'uploads', 'photos', row.filename)
    );
    const contentType =
      contentTypes[extname(row.filename).toLowerCase()] || 'application/octet-stream';

    return new NextResponse(buffer, {
      headers: noStoreHeaders(contentType),
    });
  } catch {
    return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
  }
}
