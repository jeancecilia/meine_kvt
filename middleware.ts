import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get('kvt_session')?.value;

  // Public paths
  if (pathname === '/login' || pathname.startsWith('/_next') || pathname.startsWith('/api/auth')) {
    if (pathname === '/login' && sessionToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Redirect unauthenticated requests to login
  if (!sessionToken && pathname !== '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Root redirect
  if (pathname === '/') {
    if (sessionToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
