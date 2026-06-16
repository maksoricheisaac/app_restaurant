import { NextResponse } from 'next/server';

/**
 * This endpoint is DEPRECATED.
 *
 * All image uploads must go through the NestJS backend:
 *   POST /api/v1/media/upload/menu-item/:id
 *   POST /api/v1/media/upload/category/:id
 *
 * Direct Vercel Blob uploads from the frontend are forbidden (multi-tenant
 * isolation and image processing require server-side handling).
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
