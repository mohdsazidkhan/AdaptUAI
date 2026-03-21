import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_in_production';
const secret = new TextEncoder().encode(JWT_SECRET);
const TOKEN_NAME = 'adaptuai_token';
const TOKEN_EXPIRY = '7d';

/**
 * Sign a JWT token with the given payload
 */
export async function signToken(payload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(secret);
  return token;
}

/**
 * Verify a JWT token and return the payload
 */
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

/**
 * Set the auth cookie in the response headers (for use in API routes)
 */
export function createAuthCookieHeader(token) {
  const isProduction = process.env.NODE_ENV === 'production';
  return `${TOKEN_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}${isProduction ? '; Secure' : ''}`;
}

/**
 * Clear the auth cookie
 */
export function clearAuthCookieHeader() {
  return `${TOKEN_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
}

/**
 * Get the current authenticated user from a server context (API route)
 * Returns user payload or null
 */
export async function getAuthUser(request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const tokenMatch = cookieHeader.match(new RegExp(`${TOKEN_NAME}=([^;]+)`));
    if (!tokenMatch) return null;
    const token = tokenMatch[1];
    const payload = await verifyToken(token);
    return payload;
  } catch {
    return null;
  }
}

/**
 * Get the current authenticated user from a Server Component context
 */
export async function getAuthUserFromCookies() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(TOKEN_NAME)?.value;
    if (!token) return null;
    const payload = await verifyToken(token);
    return payload;
  } catch {
    return null;
  }
}
