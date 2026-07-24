import { createHash, createHmac } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { ADMIN_COOKIE_NAME, getPrimaryAdminToken } from '@/lib/auth';
import { dbQuery } from '@/lib/db';
import { initDb } from '@/lib/schema';

const AUDIT_CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;
let lastAuditCleanupAt = 0;

function fingerprint(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function ipFingerprint(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip')?.trim() ||
    'unknown';

  return createHmac('sha256', getPrimaryAdminToken()).update(ip).digest('hex');
}

export async function recordAdminAudit(request: NextRequest, resource: string) {
  try {
    await initDb();
    const session = request.cookies.get(ADMIN_COOKIE_NAME)?.value ?? 'missing';
    const queryKeys = Array.from(request.nextUrl.searchParams.keys()).sort();
    await dbQuery(
      `
        INSERT INTO admin_audit_logs (
          session_fingerprint,
          ip_fingerprint,
          method,
          resource,
          query_keys,
          created_at
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        fingerprint(session),
        ipFingerprint(request),
        request.method,
        resource,
        JSON.stringify(queryKeys),
        new Date().toISOString(),
      ]
    );

    if (Date.now() - lastAuditCleanupAt >= AUDIT_CLEANUP_INTERVAL_MS) {
      lastAuditCleanupAt = Date.now();
      const retentionCutoff = new Date();
      retentionCutoff.setUTCFullYear(retentionCutoff.getUTCFullYear() - 2);
      await dbQuery('DELETE FROM admin_audit_logs WHERE created_at < ?', [
        retentionCutoff.toISOString(),
      ]);
    }
  } catch (error) {
    console.error('Failed to write admin audit log:', error);
  }
}
