import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_PREFIXES = ['/admin', '/super-admin'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- Protection des routes admin/super-admin ---
  // Check optimiste (UX) : l'authentification réelle est validée côté serveur
  // par les layouts (fetch /auth/profile) et côté API par le backend.
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (isProtected) {
    const session = request.cookies.get('session')?.value;
    if (!session) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // --- Injection du contexte tenant dans les headers de la REQUÊTE ---
  // Les cookies tenantId/tenantSlug sont posés par le frontend après connexion.
  // On doit les injecter dans les headers de la requête (pas de la réponse) pour
  // que `headers()` dans les Server Components les lise correctement.
  const tenantId = request.cookies.get('tenantId')?.value;
  const tenantSlug = request.cookies.get('tenantSlug')?.value;

  if (!tenantId && !tenantSlug) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);
  if (tenantId) {
    requestHeaders.set('x-tenant-id', tenantId);
  } else if (tenantSlug) {
    requestHeaders.set('x-tenant-slug', tenantSlug);
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ['/admin/:path*', '/super-admin/:path*'],
};
