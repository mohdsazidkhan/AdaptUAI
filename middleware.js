import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

// Routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/chat', '/chats', '/profile', '/transactions', '/wallet'];
// Routes that should redirect to dashboard if already logged in
const AUTH_ROUTES = ['/auth/login', '/auth/signup'];

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const tokenCookie = request.cookies.get('adaptuai_token');
  const token = tokenCookie?.value;

  let user = null;
  if (token) {
    user = await verifyToken(token);
  }

  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // Redirect unauthenticated users away from protected routes
  if (isProtected && !user) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path*',
    '/chat',
    '/chat/:path*',
    '/profile',
    '/profile/:path*',
    '/transactions',
    '/transactions/:path*',
    '/auth/login',
    '/auth/signup',
  ],
};
