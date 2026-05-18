import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// Magic bytes (file signatures) keyed by MIME type.
// For WebP: first 4 bytes = RIFF, bytes 8-11 = WEBP.
const MAGIC_SIGNATURES: Record<string, { offset: number; bytes: number[] }[]> = {
  'image/jpeg': [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }],
  'image/png': [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
  'image/gif': [
    { offset: 0, bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] }, // GIF87a
    { offset: 0, bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] }, // GIF89a
  ],
  'image/webp': [
    { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF header
    { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] }, // WEBP marker
  ],
};

function matchesMagicBytes(buf: Uint8Array, mimeType: string): boolean {
  const signatures = MAGIC_SIGNATURES[mimeType];
  if (!signatures) return false;

  if (mimeType === 'image/webp') {
    // WebP requires both offsets to match simultaneously.
    return signatures.every(({ offset, bytes }) =>
      bytes.every((b, i) => buf[offset + i] === b),
    );
  }

  // Other types: any one signature set is sufficient.
  return signatures.some(({ offset, bytes }) =>
    bytes.every((b, i) => buf[offset + i] === b),
  );
}

async function isAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    if (!token?.value) return false;

    const res = await fetch(`${process.env.BACKEND_URL}/auth/profile`, {
      headers: { Cookie: `token=${token.value}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Validate declared MIME type against allowlist first.
  const contentType = request.headers.get('content-type') ?? '';
  const mimeType = contentType.split(';')[0].trim();
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return NextResponse.json({ error: 'Type de fichier non autorisé' }, { status: 400 });
  }

  if (!request.body) {
    return NextResponse.json({ error: 'Request body is required' }, { status: 400 });
  }

  // Buffer the full body (max 5 MB) so we can inspect magic bytes before uploading.
  let fileBuffer: ArrayBuffer;
  try {
    fileBuffer = await request.arrayBuffer();
  } catch {
    return NextResponse.json({ error: 'Impossible de lire le fichier' }, { status: 400 });
  }

  if (fileBuffer.byteLength === 0) {
    return NextResponse.json({ error: 'Fichier vide' }, { status: 400 });
  }

  if (fileBuffer.byteLength > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'Fichier trop volumineux (max 5 Mo)' }, { status: 400 });
  }

  // Validate actual file content via magic bytes — the Content-Type header is user-controlled.
  const header = new Uint8Array(fileBuffer.slice(0, 16));
  if (!matchesMagicBytes(header, mimeType)) {
    return NextResponse.json(
      { error: 'Contenu du fichier invalide ou non conforme au type déclaré' },
      { status: 400 },
    );
  }

  const { searchParams } = new URL(request.url);
  const rawFilename = searchParams.get('filename');
  if (!rawFilename) {
    return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
  }

  // Sanitize filename — keep only alphanumeric, dot, dash, underscore.
  const safeFilename = rawFilename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const uniqueFilename = `${Date.now()}-${safeFilename}`;

  try {
    const blob = await put(uniqueFilename, fileBuffer, {
      access: 'public',
      contentType: mimeType,
    });
    return NextResponse.json(blob);
  } catch (error) {
    console.error("Erreur lors de l'upload:", error);
    return NextResponse.json({ error: "Erreur lors de l'upload du fichier" }, { status: 500 });
  }
}
