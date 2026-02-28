import { NextRequest, NextResponse } from 'next/server';

// Routes that require authentication
const PROTECTED = ['/dashboard'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(p + '/'));
  if (!isProtected) return NextResponse.next();

  // Check for auth cookie (name must match COOKIE_NAME on backend, default: auth_token)
  const cookieName = process.env.NEXT_PUBLIC_COOKIE_NAME ?? 'auth_token';
  const token = request.cookies.get(cookieName)?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match /dashboard and all sub-paths
    '/dashboard/:path*',
  ],
};
