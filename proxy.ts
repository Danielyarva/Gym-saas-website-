import { NextResponse, type NextRequest } from 'next/server';

const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'];
const PROTECTED_PREFIXES = ['/dashboard', '/clients'];

/**
 * Edge-side redirect UX only — NOT the security boundary. It only checks
 * whether an access/refresh cookie is *present*, never verifies the JWT
 * signature (that would require sharing the backend's JWT secret with the
 * frontend for no real security benefit). Every actual authorization
 * decision happens server-side on the backend for each API request; this
 * just avoids flashing a protected page at a signed-out visitor, or a login
 * form at someone already signed in.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get('access_token') ?? request.cookies.get('refresh_token'));

  if (pathname === '/') {
    return NextResponse.redirect(new URL(hasSession ? '/dashboard' : '/login', request.url));
  }

  if (AUTH_PATHS.some((path) => pathname.startsWith(path)) && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix)) && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$).*)'],
};
