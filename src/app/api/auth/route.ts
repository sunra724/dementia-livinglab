import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createAdminSessionToken,
  isValidAdminToken,
} from '@/lib/auth';

export const runtime = 'nodejs';

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_ATTEMPT_LIMIT = 5;
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function getClientKey(request: NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

function consumeLoginAttempt(clientKey: string) {
  const now = Date.now();
  const existing = loginAttempts.get(clientKey);

  if (!existing || existing.resetAt <= now) {
    loginAttempts.set(clientKey, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return { blocked: false, retryAfter: 0 };
  }

  existing.count += 1;
  loginAttempts.set(clientKey, existing);

  return {
    blocked: existing.count > LOGIN_ATTEMPT_LIMIT,
    retryAfter: Math.max(Math.ceil((existing.resetAt - now) / 1000), 1),
  };
}

export async function POST(request: NextRequest) {
  try {
    const clientKey = getClientKey(request);
    const attempt = consumeLoginAttempt(clientKey);

    if (attempt.blocked) {
      return NextResponse.json(
        { error: 'too_many_attempts' },
        {
          status: 429,
          headers: { 'Retry-After': String(attempt.retryAfter) },
        }
      );
    }

    const body = (await request.json()) as { password?: string };
    const password = body.password?.trim();

    if (!password) {
      return NextResponse.json({ error: 'password is required' }, { status: 400 });
    }

    if (!isValidAdminToken(password)) {
      return NextResponse.json({ error: 'invalid_password' }, { status: 401 });
    }

    loginAttempts.delete(clientKey);
    const response = NextResponse.json({ success: true });
    response.cookies.set(ADMIN_COOKIE_NAME, createAdminSessionToken(), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    console.error('POST /api/auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(ADMIN_COOKIE_NAME);
  return response;
}
