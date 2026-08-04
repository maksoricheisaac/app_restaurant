import { NextRequest, NextResponse } from 'next/server';
import { getSetupStatus } from '@/lib/setup-status';

/** Chemins qui doivent rester joignables tant que le logiciel n'est pas installé. */
const SETUP_ALLOWED_PREFIXES = ['/setup', '/maintenance'];

/**
 * Aiguillage global.
 *
 * Deux responsabilités, toutes deux purement UX — l'autorité reste au backend,
 * qui refuse lui-même les routes fermées (`SetupGuard`, `AuthGuard`) :
 *
 * 1. **Installation** — tant qu'aucun établissement n'existe, toute navigation
 *    mène à l'assistant `/setup`. Sans cela, le visiteur tomberait sur des
 *    pages vides ou des erreurs 503 sans savoir quoi en faire.
 * 2. **Administration** — contrôle optimiste de la présence d'un cookie de
 *    session avant d'ouvrir `/admin`. L'authentification réelle est validée
 *    côté serveur par les layouts (`fetch /auth/profile`) et par le backend sur
 *    chaque appel API.
 *
 * Il n'y a plus de contexte d'établissement à résoudre ni à injecter — un seul
 * restaurant, donc aucun en-tête à propager.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Première installation ───────────────────────────────────────────────
  const status = await getSetupStatus();

  if (status?.setupRequired) {
    if (SETUP_ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/setup', request.url));
  }

  // Installation terminée : l'assistant n'a plus lieu d'être. La page `/setup`
  // effectue la même redirection à son propre rendu — la faire ici évite le
  // coût d'un rendu serveur pour rien.
  if (status && pathname.startsWith('/setup')) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // ── 2. Routes d'administration ─────────────────────────────────────────────
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
  // Toutes les pages, sauf les routes API internes de Next, les ressources
  // statiques et tout ce qui porte une extension de fichier.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
