import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/auth';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const protectedPagePrefixes = [
    '/participants',
    '/workshops',
    '/budget',
    '/safety',
    '/guidebook',
  ];
  const requiresAdmin =
    pathname.startsWith('/admin') ||
    protectedPagePrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );

  if (requiresAdmin) {
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    if (!isAdminRequest(request)) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/participants/:path*',
    '/workshops/:path*',
    '/budget/:path*',
    '/safety/:path*',
    '/guidebook/:path*',
  ],
};
