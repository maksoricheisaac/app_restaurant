import { NextResponse } from 'next/server';

const MAX_AGE = 7 * 24 * 3600; // 7 jours
const IS_PROD = process.env.NODE_ENV === 'production';

/**
 * POST /api/session
 *
 * Pose le cookie httpOnly `session`, drapeau lu par le middleware pour éviter
 * d'afficher l'administration à un visiteur manifestement non connecté.
 * Appelé côté client après connexion, car `document.cookie` ne peut pas poser
 * de cookie httpOnly — seul le serveur le peut, via Set-Cookie.
 *
 * Il n'y a plus de contexte d'établissement à transporter : le logiciel n'en
 * sert qu'un seul.
 */
export async function POST() {
  const response = NextResponse.json({ ok: true });

  response.cookies.set('session', '1', {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  });

  return response;
}

/** DELETE /api/session — efface le drapeau de session à la déconnexion. */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });

  response.cookies.set('session', '', {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return response;
}
