import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

// Routes that require authentication
const PROTECTED_ROUTES = ['/user', '/admin'];
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
  const isAdminRoute = pathname.startsWith('/admin');
  const isUserRoute = pathname.startsWith('/user');

  // Redirect unauthenticated users away from protected routes
  if (isProtected && !user) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Handle root / redirect
  if (pathname === '/') {
    if (user) {
      const destination = user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
      return NextResponse.redirect(new URL(destination, request.url));
    }
  }

  // Enforce Admin role for /admin routes
  if (isAdminRoute && user?.role !== 'admin') {
    return NextResponse.redirect(new URL('/user/dashboard', request.url));
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && user) {
    const destination = user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/user/:path*',
    '/admin/:path*',
    '/auth/login',
    '/auth/signup',
  ],
};
