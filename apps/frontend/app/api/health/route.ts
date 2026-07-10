import { NextResponse } from 'next/server';

/**
 * GET /api/health
 * Liveness probe for the Next.js container — Dockerfile HEALTHCHECK targets
 * this route. Intentionally has no external dependencies (no backend call,
 * no DB): it only needs to prove the Next.js server process itself is up
 * and serving requests.
 */
export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
