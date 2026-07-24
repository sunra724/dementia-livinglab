import { createHmac, timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';

export const ADMIN_COOKIE_NAME = 'admin_session';
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

export function getAdminTokens() {
  return Array.from(
    new Set(
      (process.env.ADMIN_TOKEN ?? '')
        .split(',')
        .map((token) => token.trim())
        .filter((token) => token.length >= 10)
    )
  );
}

export function getPrimaryAdminToken() {
  const token = getAdminTokens()[0];

  if (!token) {
    throw new Error('ADMIN_TOKEN 환경변수가 설정되지 않았습니다.');
  }

  return token;
}

export function isValidAdminToken(value: string) {
  const candidate = Buffer.from(value.trim());

  return getAdminTokens().some((token) => {
    const expected = Buffer.from(token);
    return candidate.length === expected.length && timingSafeEqual(candidate, expected);
  });
}

function createSessionSignature(expiresAt: string, token: string) {
  return createHmac('sha256', token)
    .update(`dementia-livinglab-admin:${expiresAt}`)
    .digest('base64url');
}

export function createAdminSessionToken() {
  const expiresAt = String(Date.now() + ADMIN_SESSION_MAX_AGE_SECONDS * 1000);
  const signature = createSessionSignature(expiresAt, getPrimaryAdminToken());
  return `v1.${expiresAt}.${signature}`;
}

export function isValidAdminSession(value: string) {
  const [version, expiresAt, signature] = value.split('.');
  const expiresAtNumber = Number(expiresAt);

  if (
    version !== 'v1' ||
    !Number.isFinite(expiresAtNumber) ||
    expiresAtNumber <= Date.now() ||
    !signature
  ) {
    return false;
  }

  const candidate = Buffer.from(signature);

  return getAdminTokens().some((token) => {
    const expected = Buffer.from(createSessionSignature(expiresAt, token));
    return candidate.length === expected.length && timingSafeEqual(candidate, expected);
  });
}

export function isAdminRequest(request: NextRequest) {
  const session = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  return Boolean(session && isValidAdminSession(session));
}
