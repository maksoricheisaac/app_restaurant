import { NextResponse } from 'next/server';

/**
 * This endpoint is DEPRECATED.
 *
 * All image uploads must go through the NestJS backend:
 *   POST /api/v1/media/upload/menu-item/:id
 *   POST /api/v1/media/upload/category/:id
 *
 * Les uploads Vercel Blob directs depuis le frontend sont interdits : le
 * redimensionnement, la conversion WebP et la validation du type réel du
 * fichier doivent se faire côté serveur.
 */
export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    {
      error:
        'Cet endpoint est désactivé. Utilisez POST /api/v1/media/upload/menu-item/:id ou /category/:id via le backend NestJS.',
    },
    { status: 410 },
  );
}
