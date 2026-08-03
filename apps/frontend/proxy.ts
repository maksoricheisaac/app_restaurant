import { NextRequest, NextResponse } from 'next/server';

/**
 * Contrôle optimiste des routes d'administration.
 *
 * Purement UX : l'authentification réelle est validée côté serveur par les
 * layouts (fetch /auth/profile) et par le backend sur chaque appel API. Il n'y
 * a plus de contexte d'établissement à résoudre ni à injecter — un seul
 * restaurant, donc aucun en-tête à propager.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const session = request.cookies.get('session')?.value;
  const token = request.cookies.get('token')?.value;

  if (!session && !token) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Export par défaut requis par Next.js pour reconnaître ce fichier comme middleware
export default proxy;

export const config = {
  matcher: ['/admin/:path*'],
};
