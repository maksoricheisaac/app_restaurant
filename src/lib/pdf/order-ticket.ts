import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { mmToPt, wrapText, embedPngFromDataUrl, downloadPdfBytes } from './utils';
import QRCode from 'qrcode';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export type PaperWidth = '57' | '80';

interface UserInfo { name?: string | null; phone?: string | null; email?: string | null }
interface TableInfo { number: string | number }
interface OrderItem { id?: string; name: string; quantity: number; price: number }

export interface OrderLike {
  id: string;
  createdAt: string | Date;
  user: UserInfo;
  table?: TableInfo | null;
  type: string;
  status: string;
  orderItems: OrderItem[];
  total?: number | null;
}

export async function generateOrderTicketPdf(options: {
  order: OrderLike;
  paperWidth: PaperWidth;
  statusLabels: Record<string, string>;
  typeLabels: Record<string, string>;
  fileName?: string;
  openInsteadOfDownload?: boolean;
}) {
  const { order, paperWidth, statusLabels, typeLabels } = options;

  if (!order || !order.orderItems || order.orderItems.length === 0) {
    throw new Error('La commande ne contient aucun article.');
  }

  const widthMm = paperWidth === '57' ? 57 : 80;
  const marginMm = 6;

  const widthPt = mmToPt(widthMm);
  const marginPt = mmToPt(marginMm);

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // We'll calculate height dynamically by simulating layout first
  const line = (size: number) => size * 1.2; // line height factor

  const amount = (n: number) =>
    Math.round(n)
      .toLocaleString('fr-FR')
      .replace(/[\u00A0\u202f]/g, ' '); // Replace non-breaking spaces for PDF

  // Measure items section height
  const bodySize = paperWidth === '57' ? 8 : 9;
  const headerSize = paperWidth === '57' ? 11 : 12;
  const subHeaderSize = paperWidth === '57' ? 9 : 10;
  const smallSize = 8;

  const maxTextWidth = widthPt - marginPt * 2 - mmToPt(20); // leave room for price

  let heightPt = marginPt; // top margin from top we'll invert later
  // Header
  heightPt += line(headerSize) + line(subHeaderSize) + mmToPt(2);
  // Info block
  heightPt += 6 * line(smallSize);
  // Separator
  heightPt += mmToPt(2);
  // Articles title
  heightPt += line(bodySize);
  // Articles lines
  order.orderItems.forEach((it) => {
    const name = `${it.quantity} x ${it.name}`;
    const rows = wrapText(name, font, bodySize, maxTextWidth);
    heightPt += rows.length * line(bodySize);
  });
  // Separator + total
  heightPt += mmToPt(2) + line(subHeaderSize) + mmToPt(2);
  // QR + thanks
  const qrSizeMm = paperWidth === '57' ? 24 : 28;
  heightPt += mmToPt(qrSizeMm) + line(smallSize) + mmToPt(4);

  // Ensure minimum height ~120mm
  const minHeightPt = mmToPt(120);
  const pageHeightPt = Math.max(heightPt + marginPt, minHeightPt);

  const page = pdfDoc.addPage([widthPt, pageHeightPt]);
  const { height } = page.getSize();

  let cursorY = height - marginPt; // start from top
  const move = (dy: number) => { cursorY -= dy; };
  const text = (t: string, x: number, y: number, size: number, bold = false) => {
    page.drawText(t, { x, y, size, font: bold ? fontBold : font, color: rgb(0, 0, 0) });
  };
  const centerText = (t: string, y: number, size: number, bold = false) => {
    const w = (bold ? fontBold : font).widthOfTextAtSize(t, size);
    const x = (widthPt - w) / 2;
    text(t, x, y, size, bold);
  };
  const rule = (x1: number, y: number, x2: number) => {
    page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
  };

  // Header
  centerText('APP RESTAURANT', cursorY - line(headerSize), headerSize, true);
  move(line(headerSize));
  centerText('Ticket de Commande', cursorY - line(subHeaderSize), subHeaderSize, false);
  move(line(subHeaderSize) + mmToPt(2));

  // Infos
  const leftX = marginPt;
  const rightX = widthPt - marginPt;

  const created = new Date(order.createdAt);
  text(`ID: ${order.id.slice(-8).toUpperCase()}`, leftX, cursorY - line(smallSize), smallSize);
  move(line(smallSize));
  text(`Date: ${format(created, "dd/MM/yyyy", { locale: fr })} ${format(created, 'HH:mm', { locale: fr })}`, leftX, cursorY - line(smallSize), smallSize);
  move(line(smallSize));
  text(`Client: ${order.user?.name || 'Invité'}`, leftX, cursorY - line(smallSize), smallSize);
  move(line(smallSize));
  if (order.user?.phone) { text(`Tel: ${order.user.phone}`, leftX, cursorY - line(smallSize), smallSize); move(line(smallSize)); }
  if (order.table) { text(`Table: ${order.table.number}`, leftX, cursorY - line(smallSize), smallSize); move(line(smallSize)); }
  text(`Type: ${typeLabels[order.type] ?? order.type}`, leftX, cursorY - line(smallSize), smallSize);
  move(line(smallSize));
  text(`Statut: ${statusLabels[order.status] ?? order.status}`, leftX, cursorY - line(smallSize), smallSize);
  move(line(smallSize) + mmToPt(4));

  // Separator
  rule(leftX, cursorY, rightX);
  move(mmToPt(4));

  // Articles
  text('Articles:', leftX, cursorY - line(bodySize), bodySize, true);
  move(line(bodySize));

  for (const it of order.orderItems) {
    const name = `${it.quantity} x ${it.name}`;
    const rows = wrapText(name, font, bodySize, maxTextWidth);
    const price = `${amount((it.price || 0) * it.quantity)} FCFA`;
    const priceWidth = font.widthOfTextAtSize(price, bodySize);
    rows.forEach((row, idx) => {
      const y = cursorY - line(bodySize);
      text(row, leftX, y, bodySize);
      if (idx === 0) {
        text(price, rightX - priceWidth, y, bodySize);
      }
      move(line(bodySize));
    });
  }

  move(mmToPt(2));
  rule(leftX, cursorY, rightX);
  move(mmToPt(6));

  const totalText = `Total: ${amount(order.total || 0)} FCFA`;
  const totalWidth = fontBold.widthOfTextAtSize(totalText, subHeaderSize);
  text(totalText, rightX - totalWidth, cursorY - line(subHeaderSize), subHeaderSize, true);
  move(line(subHeaderSize) + mmToPt(8));

  // QR code payload
  const qrPayload = {
    id: order.id,
    total: order.total || 0,
    status: order.status,
    type: order.type,
    createdAt: new Date(order.createdAt).toISOString(),
    items: order.orderItems.map((i) => ({ n: i.name, q: i.quantity, p: i.price })),
  };
  
  const qrDataUrl = await QRCode.toDataURL(JSON.stringify(qrPayload), { width: 200, margin: 0 });
  const qrPng = await embedPngFromDataUrl(pdfDoc, qrDataUrl);
  const qrW = mmToPt(qrSizeMm);
  const qrX = (widthPt - qrW) / 2;
  const qrY = cursorY - qrW;
  page.drawImage(qrPng, { x: qrX, y: qrY, width: qrW, height: qrW });
  move(qrW + mmToPt(4));

  centerText('Merci de votre visite !', cursorY - line(smallSize), smallSize);
  move(line(smallSize) + mmToPt(4));

  const pdfBytes = await pdfDoc.save();
  const name = options.fileName ?? `commande_${order.id}.pdf`;

  if (options.openInsteadOfDownload) {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    // Don't revoke immediately when opened in new tab
  } else {
    downloadPdfBytes(pdfBytes, name);
  }
}
