import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';
import { recordAdminAudit } from '@/lib/audit';
import { dbQuery, dbQueryOne, updateById, type DbValue } from '@/lib/db';
import { ensureIssueStore } from '@/lib/issue-store';
import {
  ISSUE_CATEGORY_OPTIONS,
  ISSUE_PRIORITY_OPTIONS,
  ISSUE_STATUS_OPTIONS,
} from '@/lib/issues';
import { seedDb } from '@/lib/seed';
import type {
  IssueCategory,
  IssueInstitutionOption,
  IssueItem,
  IssuePriority,
  IssueStatus,
  IssueWorksheetSource,
} from '@/lib/types';

export const runtime = 'nodejs';

type IssuePayload = {
  id?: number;
  title?: unknown;
  category?: unknown;
  problem_statement?: unknown;
  status?: unknown;
  priority?: unknown;
  owner_institution_id?: unknown;
  source_worksheet_id?: unknown;
  idea_summary?: unknown;
  prototype_summary?: unknown;
  test_summary?: unknown;
  policy_proposal?: unknown;
};

type IssuePayloadRow = {
  issues: IssueItem[];
  institutions: IssueInstitutionOption[];
  worksheet_sources: IssueWorksheetSource[];
};

const issueFields = new Set([
  'title',
  'category',
  'problem_statement',
  'status',
  'priority',
  'owner_institution_id',
  'source_worksheet_id',
  'idea_summary',
  'prototype_summary',
  'test_summary',
  'policy_proposal',
]);

function isIssueCategory(value: unknown): value is IssueCategory {
  return ISSUE_CATEGORY_OPTIONS.some((item) => item.value === value);
}

function isIssueStatus(value: unknown): value is IssueStatus {
  return ISSUE_STATUS_OPTIONS.some((item) => item.value === value);
}

function isIssuePriority(value: unknown): value is IssuePriority {
  return ISSUE_PRIORITY_OPTIONS.some((item) => item.value === value);
}

function nullableId(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function normalizeIssueValue(field: string, value: unknown): DbValue | undefined {
  if (field === 'category') {
    return isIssueCategory(value) ? value : undefined;
  }

  if (field === 'status') {
    return isIssueStatus(value) ? value : undefined;
  }

  if (field === 'priority') {
    return isIssuePriority(value) ? value : undefined;
  }

  if (field === 'owner_institution_id' || field === 'source_worksheet_id') {
    return nullableId(value);
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  return undefined;
}

function buildChanges(payload: IssuePayload) {
  const source = payload as Record<string, unknown>;

  return Object.entries(source).reduce<Record<string, DbValue>>((result, [field, value]) => {
    if (!issueFields.has(field)) {
      return result;
    }

    const normalized = normalizeIssueValue(field, value);
    if (normalized !== undefined) {
      result[field] = normalized;
    }

    return result;
  }, {});
}

function redactPublicText(value: string) {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[이메일 비공개]')
    .replace(/(?:01[016789])[-.\s]?\d{3,4}[-.\s]?\d{4}/g, '[연락처 비공개]')
    .replace(/\b[EF]\d{3,}\b/gi, '[대상자 코드 비공개]');
}

function toPublicIssue(issue: IssueItem): IssueItem {
  return {
    ...issue,
    title: redactPublicText(issue.title),
    problem_statement: redactPublicText(issue.problem_statement),
    idea_summary: redactPublicText(issue.idea_summary),
    prototype_summary: redactPublicText(issue.prototype_summary),
    test_summary: redactPublicText(issue.test_summary),
    policy_proposal: redactPublicText(issue.policy_proposal),
    source_worksheet_id: null,
    source_workshop_title: null,
    source_template_key: null,
  };
}

async function getIssuePayload() {
  const row = await dbQueryOne<IssuePayloadRow>(`
    SELECT
      COALESCE(
        (
          SELECT json_agg(
            item
            ORDER BY
              CASE item.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
              item.updated_at DESC,
              item.id ASC
          )
          FROM (
            SELECT
              issue_items.*,
              institutions.name AS owner_institution_name,
              workshops.title AS source_workshop_title,
              worksheet_entries.template_key AS source_template_key
            FROM issue_items
            LEFT JOIN institutions ON institutions.id = issue_items.owner_institution_id
            LEFT JOIN worksheet_entries ON worksheet_entries.id = issue_items.source_worksheet_id
            LEFT JOIN workshops ON workshops.id = worksheet_entries.workshop_id
          ) AS item
        ),
        '[]'::json
      ) AS issues,
      COALESCE(
        (
          SELECT json_agg(item ORDER BY item.name ASC, item.id ASC)
          FROM (
            SELECT id, name
            FROM institutions
          ) AS item
        ),
        '[]'::json
      ) AS institutions,
      COALESCE(
        (
          SELECT json_agg(item ORDER BY item.scheduled_date ASC, item.id ASC)
          FROM (
            SELECT
              worksheet_entries.id,
              worksheet_entries.template_key,
              workshops.title AS workshop_title,
              workshops.scheduled_date
            FROM worksheet_entries
            INNER JOIN workshops ON workshops.id = worksheet_entries.workshop_id
          ) AS item
        ),
        '[]'::json
      ) AS worksheet_sources
  `);

  return {
    issues: row?.issues ?? [],
    institutions: row?.institutions ?? [],
    worksheet_sources: (row?.worksheet_sources ?? []).map((source) => ({
      id: source.id,
      template_key: source.template_key,
      workshop_title: source.workshop_title,
    })),
  };
}

export async function GET(request: NextRequest) {
  try {
    await seedDb();
    await ensureIssueStore();
    const payload = await getIssuePayload();

    if (isAdminRequest(request)) {
      await recordAdminAudit(request, 'issues');
      return NextResponse.json(payload);
    }

    return NextResponse.json({
      issues: payload.issues.map(toPublicIssue),
      institutions: [],
      worksheet_sources: [],
    });
  } catch (error) {
    console.error('GET /api/issues error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await recordAdminAudit(request, 'issues');
    await seedDb();
    await ensureIssueStore();
    const payload = (await request.json()) as IssuePayload;
    const title = typeof payload.title === 'string' ? payload.title.trim() : '';
    const problemStatement =
      typeof payload.problem_statement === 'string' ? payload.problem_statement.trim() : '';

    if (!title || !problemStatement || !isIssueCategory(payload.category)) {
      return NextResponse.json(
        { error: 'title, problem_statement and valid category are required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const code = `ISSUE-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

    await dbQuery(
      `
        INSERT INTO issue_items (
          code, title, category, problem_statement, status, priority,
          owner_institution_id, source_worksheet_id, idea_summary,
          prototype_summary, test_summary, policy_proposal, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        code,
        title,
        payload.category,
        problemStatement,
        isIssueStatus(payload.status) ? payload.status : 'problem_defined',
        isIssuePriority(payload.priority) ? payload.priority : 'medium',
        nullableId(payload.owner_institution_id),
        nullableId(payload.source_worksheet_id),
        typeof payload.idea_summary === 'string' ? payload.idea_summary.trim() : '',
        typeof payload.prototype_summary === 'string' ? payload.prototype_summary.trim() : '',
        typeof payload.test_summary === 'string' ? payload.test_summary.trim() : '',
        typeof payload.policy_proposal === 'string' ? payload.policy_proposal.trim() : '',
        now,
        now,
      ]
    );

    return NextResponse.json({ success: true, code });
  } catch (error) {
    console.error('POST /api/issues error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await recordAdminAudit(request, 'issues');
    await seedDb();
    await ensureIssueStore();
    const payload = (await request.json()) as IssuePayload;

    if (typeof payload.id !== 'number') {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const changes = buildChanges(payload);
    if (!Object.keys(changes).length) {
      return NextResponse.json({ error: 'No valid issue fields provided' }, { status: 400 });
    }

    changes.updated_at = new Date().toISOString();
    await updateById('issue_items', payload.id, changes);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/issues error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
