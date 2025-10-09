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
  deliveryFee?: number | null;
  amountPaid?: number | null;
  change?: number | null;
}

export async function generateOrderTicketPdf(options: {
  order: OrderLike;
  paperWidth: PaperWidth;
  statusLabels: Record<string, string>;
  typeLabels: Record<string, string>;
  fileName?: string;
  openInsteadOfDownload?: boolean;
  amountPaid?: number;
}) {
  const { order, paperWidth, statusLabels, typeLabels } = options;

  if (!order || !order.orderItems || order.orderItems.length === 0) {
    throw new Error('La commande ne contient aucun article.');
  }

  const widthMm = paperWidth === '57' ? 57 : 80;
  const marginMm = 8; // Augmenté de 6 à 8mm pour plus d'espace

  const widthPt = mmToPt(widthMm);
  const marginPt = mmToPt(marginMm);

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // We'll calculate height dynamically by simulating layout first
  const line = (size: number) => size * 1.3; // line height factor (augmenté pour plus d'espace)

  const amount = (n: number) =>
    Math.round(n)
      .toLocaleString('fr-FR')
      .replace(/[\u00A0\u202f]/g, ' '); // Replace non-breaking spaces for PDF

  // Measure items section height - tailles augmentées pour meilleure lisibilité
  const bodySize = paperWidth === '57' ? 9 : 10;
  const headerSize = paperWidth === '57' ? 14 : 15;
  const subHeaderSize = paperWidth === '57' ? 11 : 12;
  const smallSize = 9;

  const maxTextWidth = widthPt - marginPt * 2 - mmToPt(20); // leave room for price

  let heightPt = marginPt; // top margin from top we'll invert later
  // Header
  heightPt += line(headerSize) + line(subHeaderSize) + mmToPt(4);
  // Info block
  heightPt += 7 * line(smallSize) + mmToPt(2);
  // Separator
  heightPt += mmToPt(4);
  // Articles title
  heightPt += line(bodySize) + mmToPt(2);
  // Articles lines
  order.orderItems.forEach((it) => {
    const name = `${it.quantity} x ${it.name}`;
    const rows = wrapText(name, font, bodySize, maxTextWidth);
    heightPt += rows.length * line(bodySize) + mmToPt(1.5);
  });
  // Separator + total
  heightPt += mmToPt(2) + line(subHeaderSize) + mmToPt(2);
  // QR + thanks
  const qrSizeMm = paperWidth === '57' ? 28 : 32;
  heightPt += mmToPt(qrSizeMm) + line(smallSize) * 2 + mmToPt(8);

  // Ensure minimum height ~150mm pour meilleure impression
  const minHeightPt = mmToPt(150);
  const pageHeightPt = Math.max(heightPt + marginPt * 2, minHeightPt);

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
  const rule = (x1: number, y: number, x2: number, thickness = 0.5) => {
    page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness, color: rgb(0.3, 0.3, 0.3) });
  };
  
  const dashedRule = (x1: number, y: number, x2: number) => {
    const dashLength = 3;
    const gapLength = 2;
    let currentX = x1;
    while (currentX < x2) {
      const endX = Math.min(currentX + dashLength, x2);
      page.drawLine({ start: { x: currentX, y }, end: { x: endX, y }, thickness: 0.5, color: rgb(0.5, 0.5, 0.5) });
      currentX += dashLength + gapLength;
    }
  };

  // Header avec style amélioré (sans emojis pour compatibilité PDF)
  centerText('APP RESTAURANT', cursorY - line(headerSize), headerSize, true);
  move(line(headerSize) + mmToPt(1));
  centerText('--- Ticket de Commande ---', cursorY - line(subHeaderSize), subHeaderSize, false);
  move(line(subHeaderSize) + mmToPt(4));

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
  move(line(smallSize) + mmToPt(6));

  // Separator avec style
  rule(leftX, cursorY, rightX, 1);
  move(mmToPt(4));

  // Articles avec en-tête
  text('ARTICLES COMMANDÉS', leftX, cursorY - line(bodySize), bodySize, true);
  move(line(bodySize) + mmToPt(2));
  dashedRule(leftX, cursorY, rightX);
  move(mmToPt(4));

  for (const it of order.orderItems) {
    const name = `${it.quantity} x ${it.name}`;
    const rows = wrapText(name, font, bodySize, maxTextWidth);
    const price = `${amount((it.price || 0) * it.quantity)} FCFA`;
    const priceWidth = font.widthOfTextAtSize(price, bodySize);
    rows.forEach((row, idx) => {
      const y = cursorY - line(bodySize);
      text(row, leftX, y, bodySize);
      if (idx === 0) {
        text(price, rightX - priceWidth, y, bodySize, true);
      }
      move(line(bodySize));
    });
    move(mmToPt(2)); // Espacement entre articles augmenté
  }

  move(mmToPt(3));
  rule(leftX, cursorY, rightX, 1.5);
  move(mmToPt(5));

  // Total breakdown with delivery fee if applicable
  const subtotal = (order.total || 0) - (order.deliveryFee || 0);
  
  if (order.deliveryFee && order.deliveryFee > 0) {
    // Show subtotal
    const subtotalText = `Sous-total: ${amount(subtotal)} FCFA`;
    const subtotalWidth = font.widthOfTextAtSize(subtotalText, bodySize);
    text(subtotalText, (widthPt - subtotalWidth) / 2, cursorY - line(bodySize), bodySize);
    move(line(bodySize) + mmToPt(1));
    
    // Show delivery fee
    const deliveryText = `Frais de livraison: ${amount(order.deliveryFee)} FCFA`;
    const deliveryWidth = font.widthOfTextAtSize(deliveryText, bodySize);
    text(deliveryText, (widthPt - deliveryWidth) / 2, cursorY - line(bodySize), bodySize);
    move(line(bodySize) + mmToPt(2));
    
    // Separator line
    dashedRule(leftX, cursorY, rightX);
    move(mmToPt(3));
  }
  
  // Total avec mise en valeur
  const totalText = `TOTAL: ${amount(order.total || 0)} FCFA`;
  const totalWidth = fontBold.widthOfTextAtSize(totalText, subHeaderSize + 2);
  text(totalText, (widthPt - totalWidth) / 2, cursorY - line(subHeaderSize + 2), subHeaderSize + 2, true);
  move(line(subHeaderSize + 2) + mmToPt(2));
  
  // Payment information if available
  const amountPaid = options.amountPaid || order.amountPaid;
  if (amountPaid && amountPaid > 0) {
    const paidText = `REÇU: ${amount(amountPaid)} FCFA`;
    const paidWidth = font.widthOfTextAtSize(paidText, bodySize);
    text(paidText, (widthPt - paidWidth) / 2, cursorY - line(bodySize), bodySize);
    move(line(bodySize) + mmToPt(1));
    
    const change = amountPaid - (order.total || 0);
    if (change > 0) {
      const changeText = `MONNAIE: ${amount(change)} FCFA`;
      const changeWidth = fontBold.widthOfTextAtSize(changeText, bodySize);
      text(changeText, (widthPt - changeWidth) / 2, cursorY - line(bodySize), bodySize, true);
      move(line(bodySize) + mmToPt(2));
    }
  }
  
  rule(leftX, cursorY, rightX, 1.5);
  move(mmToPt(8));

  // QR code payload
  const qrPayload = {
    id: order.id,
    total: order.total || 0,
    status: order.status,
    type: order.type,
    createdAt: new Date(order.createdAt).toISOString(),
    items: order.orderItems.map((i) => ({ n: i.name, q: i.quantity, p: i.price })),
  };
  
  // QR Code avec cadre
  const qrDataUrl = await QRCode.toDataURL(JSON.stringify(qrPayload), { width: 250, margin: 1 });
  const qrPng = await embedPngFromDataUrl(pdfDoc, qrDataUrl);
  const qrW = mmToPt(qrSizeMm);
  const qrX = (widthPt - qrW) / 2;
  const qrY = cursorY - qrW;
  
  // Cadre autour du QR code
  const padding = mmToPt(3);
  page.drawRectangle({
    x: qrX - padding,
    y: qrY - padding,
    width: qrW + padding * 2,
    height: qrW + padding * 2,
    borderColor: rgb(0.3, 0.3, 0.3),
    borderWidth: 1.5,
  });
  
  page.drawImage(qrPng, { x: qrX, y: qrY, width: qrW, height: qrW });
  move(qrW + mmToPt(6));

  // Message de remerciement stylisé (sans emojis pour compatibilité PDF)
  centerText('Merci de votre visite !', cursorY - line(smallSize + 2), smallSize + 2, true);
  move(line(smallSize + 2) + mmToPt(3));
  centerText('A bientot !', cursorY - line(smallSize + 1), smallSize + 1);
  move(line(smallSize + 1) + mmToPt(6));

  const pdfBytes = await pdfDoc.save();
  const name = options.fileName ?? `commande_${order.id}.pdf`;

  if (options.openInsteadOfDownload) {
    const arrayBuffer = new ArrayBuffer(pdfBytes.byteLength);
    new Uint8Array(arrayBuffer).set(pdfBytes);
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    // Don't revoke immediately when opened in new tab
  } else {
    downloadPdfBytes(pdfBytes, name);
  }
}
