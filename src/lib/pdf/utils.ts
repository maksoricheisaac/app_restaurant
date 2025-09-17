import { PDFDocument, PDFFont, StandardFonts } from 'pdf-lib';

// Unit conversion
export const mmToPt = (mm: number) => mm * 2.8346456693; // 1 mm = 2.8346456693 pt

export async function createPdfDoc() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  return { pdfDoc, font };
}

export function downloadPdfBytes(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes], { type: 'application/pdf' });
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
