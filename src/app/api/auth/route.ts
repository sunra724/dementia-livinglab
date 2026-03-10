import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const COOKIE_NAME = 'admin_token';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { password?: string };

    if (!body.password) {
      return NextResponse.json({ error: 'password is required' }, { status: 400 });
    }

    if (body.password !== process.env.ADMIN_TOKEN) {
      return NextResponse.json({ error: 'invalid_password' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, body.password, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (error) {
    console.error('POST /api/auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(COOKIE_NAME);
  return response;
}
