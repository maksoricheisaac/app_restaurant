import { NextRequest, NextResponse } from 'next/server';

const MAX_AGE = 7 * 24 * 3600; // 7 days, matches AuthContext SESSION_COOKIE_MAX_AGE
const IS_PROD = process.env.NODE_ENV === 'production';

/**
 * POST /api/session
 * Sets httpOnly session + tenant context cookies after successful auth.
 * Body: { tenantId?: string; tenantSlug?: string }
 *
 * Called client-side after login/onboarding because document.cookie cannot
 * set httpOnly cookies — only the server can via Set-Cookie header.
 */
export async function POST(request: NextRequest) {
  let body: { tenantId?: string; tenantSlug?: string } = {};
  try {
    body = await request.json();
  } catch {
    // Empty body is allowed — sets session cookie only
  }

  const response = NextResponse.json({ ok: true });

  response.cookies.set('session', '1', {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  });

  if (body.tenantId) {
    response.cookies.set('tenantId', body.tenantId, {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: 'lax',
      maxAge: MAX_AGE,
      path: '/',
    });
  }

  if (body.tenantSlug) {
    response.cookies.set('tenantSlug', body.tenantSlug, {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: 'lax',
      maxAge: MAX_AGE,
      path: '/',
    });
  }

  return response;
}

/**
 * DELETE /api/session
 * Clears all session cookies on logout.
 */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });

  for (const name of ['session', 'tenantId', 'tenantSlug']) {
    response.cookies.set(name, '', {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
  }

  return response;
}
