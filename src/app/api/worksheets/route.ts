import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { seedDb } from '@/lib/seed';
import type {
  WorksheetContributorRole,
  WorksheetEntry,
  WorksheetTemplateKey,
  WorksheetToken,
  Workshop,
} from '@/lib/types';
import { buildWorksheetUrl } from '@/lib/worksheets';

export const runtime = 'nodejs';

type WorksheetEntryRow = Omit<WorksheetEntry, 'reviewed'> & { reviewed: number };
type WorksheetTokenRow = Omit<WorksheetToken, 'active'> & { active: number };
type WorkshopSummary = Pick<Workshop, 'id' | 'title' | 'phase' | 'scheduled_date'>;

type SubmitPayload = {
  action: 'submit';
  token?: string;
  workshop_id: number;
  template_key: WorksheetTemplateKey;
  group_name: string;
  filled_by_name: string;
  filled_by_role: WorksheetContributorRole;
  content_json: string;
};

type CreateTokenPayload = {
  action: 'create_token';
  workshop_id: number;
  template_key: WorksheetTemplateKey;
};

type ReviewPayload = {
  action: 'review';
  id: number;
  reviewed_by: string;
  review_note: string;
};

type DeactivateTokenPayload = {
  action: 'deactivate_token';
  id: number;
};

type PostPayload = SubmitPayload | CreateTokenPayload;
type PutPayload = ReviewPayload | DeactivateTokenPayload;

function toWorksheetEntry(row: WorksheetEntryRow): WorksheetEntry {
  return {
    ...row,
    reviewed: Boolean(row.reviewed),
  };
}

function toWorksheetToken(row: WorksheetTokenRow): WorksheetToken {
  return {
    ...row,
    active: Boolean(row.active),
  };
}

function isTokenExpired(expiresAt: string | null) {
  return expiresAt ? new Date(expiresAt).getTime() < Date.now() : false;
}

function getTokenByValue(token: string) {
  const db = getDb();
  return db
    .prepare('SELECT * FROM worksheet_tokens WHERE token = ? LIMIT 1')
    .get(token) as WorksheetTokenRow | undefined;
}

function getEntryByTokenId(tokenId: number) {
  const db = getDb();
  const row = db
    .prepare('SELECT * FROM worksheet_entries WHERE token_id = ? LIMIT 1')
    .get(tokenId) as WorksheetEntryRow | undefined;

  return row ? toWorksheetEntry(row) : null;
}

function buildStats(entries: WorksheetEntry[]) {
  return entries.reduce<{
    total: number;
    submitted: number;
    reviewed: number;
    by_template: Partial<Record<WorksheetTemplateKey, number>>;
    by_workshop: Record<number, number>;
  }>(
    (stats, entry) => {
      stats.total += 1;

      if (entry.submitted_at) {
        stats.submitted += 1;
      }

      if (entry.reviewed) {
        stats.reviewed += 1;
      }

      stats.by_template[entry.template_key] = (stats.by_template[entry.template_key] ?? 0) + 1;
      stats.by_workshop[entry.workshop_id] = (stats.by_workshop[entry.workshop_id] ?? 0) + 1;
      return stats;
    },
    {
      total: 0,
      submitted: 0,
      reviewed: 0,
      by_template: {},
      by_workshop: {},
    }
  );
}

function validateTemplateKey(value: unknown): value is WorksheetTemplateKey {
  return (
    value === 'observation_log' ||
    value === 'hmw' ||
    value === 'persona' ||
    value === 'empathy_map' ||
    value === 'journey_map' ||
    value === 'idea_card' ||
    value === 'prototype_spec' ||
    value === 'test_result' ||
    value === 'reflection'
  );
}

export async function GET(request: NextRequest) {
  try {
    seedDb();
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const workshopId = searchParams.get('workshop_id');

    if (token) {
      const tokenRow = getTokenByValue(token);
      if (!tokenRow || !tokenRow.active || isTokenExpired(tokenRow.expires_at)) {
        return NextResponse.json({
          valid: false,
          workshop: null,
          template_key: null,
          existing_entry: null,
        });
      }

      const workshop = db
        .prepare('SELECT id, title, phase, scheduled_date FROM workshops WHERE id = ? LIMIT 1')
        .get(tokenRow.workshop_id) as WorkshopSummary | undefined;

      return NextResponse.json({
        valid: Boolean(workshop),
        workshop: workshop ?? null,
        template_key: tokenRow.template_key,
        existing_entry: getEntryByTokenId(tokenRow.id),
      });
    }

    const entryRows = workshopId
      ? (db
          .prepare('SELECT * FROM worksheet_entries WHERE workshop_id = ? ORDER BY submitted_at DESC, id DESC')
          .all(Number(workshopId)) as WorksheetEntryRow[])
      : (db
          .prepare('SELECT * FROM worksheet_entries ORDER BY submitted_at DESC, id DESC')
          .all() as WorksheetEntryRow[]);

    const tokenRows = workshopId
      ? (db
          .prepare('SELECT * FROM worksheet_tokens WHERE workshop_id = ? ORDER BY created_at DESC, id DESC')
          .all(Number(workshopId)) as WorksheetTokenRow[])
      : (db
          .prepare('SELECT * FROM worksheet_tokens ORDER BY created_at DESC, id DESC')
          .all() as WorksheetTokenRow[]);

    const entries = entryRows.map(toWorksheetEntry);

    return NextResponse.json({
      entries,
      tokens: tokenRows.map(toWorksheetToken),
      stats: buildStats(entries),
    });
  } catch (error) {
    console.error('GET /api/worksheets error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    seedDb();
    const db = getDb();
    const payload = (await request.json()) as PostPayload;

    if (payload.action === 'create_token') {
      if (typeof payload.workshop_id !== 'number' || !validateTemplateKey(payload.template_key)) {
        return NextResponse.json({ error: 'Invalid create_token payload' }, { status: 400 });
      }

      let token = '';

      while (!token) {
        const candidate = `ws-${crypto.randomBytes(3).toString('hex')}`;
        const exists = db
          .prepare('SELECT 1 FROM worksheet_tokens WHERE token = ? LIMIT 1')
          .get(candidate) as { 1: number } | undefined;

        if (!exists) {
          token = candidate;
        }
      }

      const createdAt = new Date().toISOString();
      db.prepare(
        `
          INSERT INTO worksheet_tokens (token, workshop_id, template_key, created_at, active)
          VALUES (?, ?, ?, ?, 1)
        `
      ).run(token, payload.workshop_id, payload.template_key, createdAt);

      return NextResponse.json({
        token,
        url: buildWorksheetUrl(request.nextUrl.origin, token),
      });
    }

    if (payload.action === 'submit') {
      const name = String(payload.filled_by_name ?? '').trim();
      const groupName = String(payload.group_name ?? '').trim();
      const role =
        payload.filled_by_role === 'facilitator' ? 'facilitator' : ('activist' as WorksheetContributorRole);

      if (
        typeof payload.workshop_id !== 'number' ||
        !validateTemplateKey(payload.template_key) ||
        name.length === 0
      ) {
        return NextResponse.json({ error: 'Invalid submit payload' }, { status: 400 });
      }

      let tokenId: number | null = null;

      if (payload.token) {
        const tokenRow = getTokenByValue(payload.token);

        if (
          !tokenRow ||
          !tokenRow.active ||
          isTokenExpired(tokenRow.expires_at) ||
          tokenRow.workshop_id !== payload.workshop_id ||
          tokenRow.template_key !== payload.template_key
        ) {
          return NextResponse.json({ error: 'Token is invalid' }, { status: 400 });
        }

        const existingEntry = getEntryByTokenId(tokenRow.id);
        if (existingEntry) {
          return NextResponse.json({ error: 'Worksheet already submitted for this token' }, { status: 409 });
        }

        tokenId = tokenRow.id;
      }

      const result = db
        .prepare(
          `
            INSERT INTO worksheet_entries (
              token_id,
              workshop_id,
              template_key,
              group_name,
              filled_by_name,
              filled_by_role,
              content_json,
              submitted_at,
              reviewed,
              reviewed_by,
              reviewed_at,
              review_note
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, '', NULL, '')
          `
        )
        .run(
          tokenId,
          payload.workshop_id,
          payload.template_key,
          groupName,
          name,
          role,
          payload.content_json,
          new Date().toISOString()
        );

      const entry = db
        .prepare('SELECT * FROM worksheet_entries WHERE id = ? LIMIT 1')
        .get(result.lastInsertRowid) as WorksheetEntryRow | undefined;

      return NextResponse.json({
        success: true,
        entry: entry ? toWorksheetEntry(entry) : null,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('POST /api/worksheets error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    seedDb();
    const db = getDb();
    const payload = (await request.json()) as PutPayload;

    if (payload.action === 'review') {
      const reviewer = String(payload.reviewed_by ?? '').trim();
      if (typeof payload.id !== 'number' || reviewer.length === 0) {
        return NextResponse.json({ error: 'Invalid review payload' }, { status: 400 });
      }

      db.prepare(
        `
          UPDATE worksheet_entries
          SET reviewed = 1,
              reviewed_by = ?,
              reviewed_at = ?,
              review_note = ?
          WHERE id = ?
        `
      ).run(reviewer, new Date().toISOString(), String(payload.review_note ?? '').trim(), payload.id);

      return NextResponse.json({ success: true });
    }

    if (payload.action === 'deactivate_token') {
      if (typeof payload.id !== 'number') {
        return NextResponse.json({ error: 'Invalid deactivate_token payload' }, { status: 400 });
      }

      db.prepare('UPDATE worksheet_tokens SET active = 0 WHERE id = ?').run(payload.id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('PUT /api/worksheets error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
