/**
 * Shared cookie options for all auth cookies.
 * httpOnly: JS cannot read the token — XSS-resistant.
 * secure:   HTTPS-only in production.
 * sameSite: Lax — CSRF protection for cross-site POST requests.
 */
export const COOKIE_OPTS_BASE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
} as const;
