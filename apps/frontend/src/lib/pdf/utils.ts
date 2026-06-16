import { PDFDocument, PDFFont, PDFImage, StandardFonts } from 'pdf-lib';

// ─── Shared restaurant branding passed to every PDF generator ─────────────────
export interface RestaurantInfo {
  name:         string;
  logoUrl?:     string | null;
  phone?:       string | null;
  email?:       string | null;
  address?:     string | null;
  primaryColor?: string | null; // hex e.g. "#f97316"
}

/**
 * Fetches a public image URL and embeds it in the PDF document.
 * Supports PNG and JPEG. Returns null silently on any failure so PDF still
 * renders without the logo rather than crashing.
 */
export async function fetchLogoForPdf(
  pdfDoc: PDFDocument,
  url: string,
): Promise<{ image: PDFImage; width: number; height: number } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    const ct = res.headers.get('content-type') ?? '';
    const isPng = ct.includes('png') || url.toLowerCase().includes('.png');
    const image = isPng
      ? await pdfDoc.embedPng(bytes)
      : await pdfDoc.embedJpg(bytes);
    const { width, height } = image.size();
    return { image, width, height };
  } catch {
    return null;
  }
}

// Unit conversion
export const mmToPt = (mm: number) => mm * 2.8346456693; // 1 mm = 2.8346456693 pt

export async function createPdfDoc() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  return { pdfDoc, font };
}

export function downloadPdfBytes(bytes: Uint8Array, filename: string) {
  const arrayBuffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(arrayBuffer).set(bytes);
  const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function measureText(text: string, font: PDFFont, size: number): number {
  return font.widthOfTextAtSize(text, size);
}

export function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? current + ' ' + word : word;
    if (measureText(test, font, size) <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      if (measureText(word, font, size) <= maxWidth) {
        current = word;
      } else {
        // hard wrap long word
        let chunk = '';
        for (const ch of word) {
          const t = chunk + ch;
          if (measureText(t, font, size) <= maxWidth) chunk = t;
          else {
            if (chunk) lines.push(chunk);
            chunk = ch;
          }
        }
        current = chunk;
      }
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function embedPngFromDataUrl(pdfDoc: PDFDocument, dataUrl: string) {
  // Fetch the data URL into bytes in browser
  const res = await fetch(dataUrl);
  const bytes = await res.arrayBuffer();
  return pdfDoc.embedPng(bytes);
}
