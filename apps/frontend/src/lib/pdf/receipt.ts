import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { mmToPt, wrapText, fetchLogoForPdf, downloadPdfBytes, type RestaurantInfo } from './utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface OrderItemOption { groupName: string; optionName: string; priceDelta: number }
interface TaxBucket { rate: number; exclTax: number; tax: number; inclTax: number }
interface OrderItem { id?: string; quantity: number; price: number; menuItem?: { name: string }; name?: string; options?: OrderItemOption[] | null }

/**
 * Ligne récapitulant les options d'un article, ou `null` s'il n'en porte pas.
 * Utilisée à l'identique par le calcul de hauteur de page et par le rendu :
 * les deux doivent voir exactement les mêmes lignes, sans quoi le ticket se
 * retrouve tronqué ou surdimensionné.
 */
function optionsLine(item: OrderItem): string | null {
  if (!item.options || item.options.length === 0) return null;
  return item.options.map((o) => `${o.groupName}: ${o.optionName}`).join(' · ');
}

export interface PaymentLike {
  amount: number;
  method: string;
  reference?: string | null;
  createdAt: string | Date;
  cashier: { name: string };
  order: {
    id: string;
    customer?: { name: string } | null;
    table?: { number: string | number } | null;
    orderItems: OrderItem[];
    /** Ventilation par taux, calculée serveur. Absente = rien à imprimer. */
    taxBuckets?: TaxBucket[];
    subtotalExclTax?: number | null;
    taxTotal?: number | null;
  };
}

function methodLabel(method: string) {
  switch (method) {
    case 'cash':
      return 'Espèces';
    case 'mobile_money':
      return 'Mobile Money';
    case 'card':
      return 'Carte';
    case 'bank_transfer':
      return 'Virement';
    default:
      return method;
  }
}

export async function generateReceiptPdf(
  payment: PaymentLike,
  opts?: { fileName?: string; openInsteadOfDownload?: boolean; restaurant?: RestaurantInfo },
) {
  if (!payment?.order?.orderItems?.length) throw new Error('Aucun article dans la commande.');

  const restaurant   = opts?.restaurant;
  const restName     = restaurant?.name ?? 'Votre Restaurant';
  const restPhone    = restaurant?.phone;
  const restEmail    = restaurant?.email;
  const restAddress  = restaurant?.address;

  const widthMm = 80;
  const marginMm = 8;

  const widthPt = mmToPt(widthMm);
  const marginPt = mmToPt(marginMm);

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const sizeTitle = 14;
  const sizeBody = 10;
  const sizeSmall = 9;
  const lh = (s: number) => s * 1.25;

  const amount = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n)).replace(/\u00A0/g, ' ');

  const logoSizeMm = 16;
  const contactLines = [restPhone, restEmail, restAddress].filter(Boolean).length;

  // Pre-calc height
  let h = marginPt;
  if (restaurant?.logoUrl) h += mmToPt(logoSizeMm) + mmToPt(2); // logo
  h += lh(sizeTitle) * 2 + mmToPt(2) + contactLines * lh(sizeSmall); // header
  h += lh(sizeSmall) * 3 + mmToPt(4); // order info
  h += mmToPt(2); // rule
  h += lh(sizeBody); // items title
  const nameWidth = widthPt - marginPt * 2 - mmToPt(26);
  payment.order.orderItems.forEach((it) => {
    const name = `${it.quantity}× ${(it.menuItem?.name || it.name || '')}`;
    const rows = wrapText(name, font, sizeBody, nameWidth);
    h += rows.length * lh(sizeBody);

    const options = optionsLine(it);
    if (options) {
      h += wrapText(options, font, sizeSmall, nameWidth).length * lh(sizeSmall);
    }
  });
  h += mmToPt(4); // rule
  h += lh(sizeBody); // total line
  // Ventilation de TVA : un en-tête plus une ligne par taux.
  const taxBuckets = payment.order.taxBuckets ?? [];
  if (taxBuckets.length > 0) {
    h += mmToPt(2) + lh(sizeSmall) * (taxBuckets.length + 1);
  }
  h += mmToPt(4);
  h += lh(sizeSmall) * 4 + mmToPt(4); // payment info
  h += lh(sizeSmall) * 2 + mmToPt(6); // footer

  const minHeightPt = mmToPt(120);
  const pageHeight = Math.max(h + marginPt, minHeightPt);
  const page = pdfDoc.addPage([widthPt, pageHeight]);

  const { height } = page.getSize();
  let y = height - marginPt;
  const move = (dy: number) => { y -= dy; };
  const text = (t: string, x: number, yy: number, s: number, b = false) => page.drawText(t, { x, y: yy, size: s, font: b ? bold : font, color: rgb(0,0,0) });
  const center = (t: string, s: number, b = false) => {
    const w = (b ? bold : font).widthOfTextAtSize(t, s);
    const x = (widthPt - w) / 2;
    text(t, x, y - lh(s), s, b);
    move(lh(s));
  };
  const rule = () => page.drawLine({ start: { x: marginPt, y }, end: { x: widthPt - marginPt, y }, thickness: 0.5, color: rgb(0.8,0.8,0.8) });

  // ── Header ──────────────────────────────────────────────────────────────
  if (restaurant?.logoUrl) {
    const logo = await fetchLogoForPdf(pdfDoc, restaurant.logoUrl);
    if (logo) {
      const logoSizePt = mmToPt(logoSizeMm);
      const logoW = logoSizePt * (logo.width / logo.height);
      const logoX = (widthPt - logoW) / 2;
      page.drawImage(logo.image, { x: logoX, y: y - logoSizePt, width: logoW, height: logoSizePt });
      move(logoSizePt + mmToPt(2));
    }
  }
  center(restName, sizeTitle, true);
  const _rawCreated = new Date(payment.createdAt);
  const created = isNaN(_rawCreated.getTime()) ? new Date() : _rawCreated;
  center(format(created, "dd/MM/yyyy 'à' HH:mm", { locale: fr }), sizeSmall, false);
  move(mmToPt(2));

  // Order info
  const left = marginPt;
  text(`Commande #${payment.order.id.slice(-6).toUpperCase()}`, left, y - lh(sizeSmall), sizeSmall, true);
  move(lh(sizeSmall));
  if (payment.order.customer?.name) { text(`Client: ${payment.order.customer.name}`, left, y - lh(sizeSmall), sizeSmall); move(lh(sizeSmall)); }
  if (payment.order.table?.number != null) { text(`Table: ${payment.order.table.number}`, left, y - lh(sizeSmall), sizeSmall); move(lh(sizeSmall)); }
  move(mmToPt(4));

  // Rule
  rule();
  move(mmToPt(3));

  // Items
  text('Articles commandés:', left, y - lh(sizeBody), sizeBody, true);
  move(lh(sizeBody));

  const right = widthPt - marginPt;
  for (const it of payment.order.orderItems) {
    const name = `${it.quantity}× ${(it.menuItem?.name || it.name || '')}`;
    const rows = wrapText(name, font, sizeBody, nameWidth);
    const priceText = amount((it.price || 0) * it.quantity);
    const pW = font.widthOfTextAtSize(priceText, sizeBody);
    rows.forEach((row, idx) => {
      const yy = y - lh(sizeBody);
      text(row, left, yy, sizeBody);
      if (idx === 0) text(priceText, right - pW, yy, sizeBody);
      move(lh(sizeBody));
    });

    // Options et suppléments retenus : ils sont inclus dans le prix affiché,
    // le client doit pouvoir vérifier ce qu'il a payé.
    const options = optionsLine(it);
    if (options) {
      wrapText(options, font, sizeSmall, nameWidth).forEach((row) => {
        text(row, left + mmToPt(3), y - lh(sizeSmall), sizeSmall);
        move(lh(sizeSmall));
      });
    }
  }

  move(mmToPt(2));
  rule();
  move(mmToPt(4));

  // Total
  const totalText = `TOTAL: ${amount(payment.amount)}`;
  const tW = bold.widthOfTextAtSize(totalText, sizeBody + 2);
  text(totalText, right - tW, y - lh(sizeBody + 2), sizeBody + 2, true);

  // Ventilation par taux. Un ticket portant plusieurs taux doit détailler la
  // base et la taxe de chacun : un total global ne permet ni au client ni au
  // comptable de refaire le calcul.
  if (taxBuckets.length > 0) {
    move(lh(sizeBody + 2) + mmToPt(2));

    const columnAt = (ratio: number) => left + (right - left) * ratio;
    text('TVA', left, y - lh(sizeSmall), sizeSmall, true);
    text('Base HT', columnAt(0.45), y - lh(sizeSmall), sizeSmall, true);
    text('Taxe', columnAt(0.75), y - lh(sizeSmall), sizeSmall, true);
    move(lh(sizeSmall));

    for (const bucket of taxBuckets) {
      const yy = y - lh(sizeSmall);
      text(`${bucket.rate} %`, left, yy, sizeSmall);
      text(amount(bucket.exclTax), columnAt(0.45), yy, sizeSmall);
      text(amount(bucket.tax), columnAt(0.75), yy, sizeSmall);
      move(lh(sizeSmall));
    }
  }
  move(lh(sizeBody + 2));
  move(mmToPt(4));

  // Payment info
  text(`Méthode: ${methodLabel(payment.method)}`, left, y - lh(sizeSmall), sizeSmall);
  move(lh(sizeSmall));
  if (payment.reference) { text(`Référence: ${payment.reference}`, left, y - lh(sizeSmall), sizeSmall); move(lh(sizeSmall)); }
  text(`Caissier: ${payment.cashier.name}`, left, y - lh(sizeSmall), sizeSmall);
  move(lh(sizeSmall));

  // Footer
  move(mmToPt(4));
  center('Merci pour votre visite !', sizeSmall, true);
  center('Nous espérons vous revoir bientôt', sizeSmall);
  if (restPhone)   center(`Tél: ${restPhone}`, sizeSmall);
  if (restEmail)   center(`Email: ${restEmail}`, sizeSmall);
  if (restAddress) center(restAddress, sizeSmall);

  const bytes = await pdfDoc.save();
  const fileName = opts?.fileName ?? `recu_${payment.order.id.slice(-6).toUpperCase()}_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`;
  if (opts?.openInsteadOfDownload) {
    const arrayBuffer = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(arrayBuffer).set(bytes);
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  } else {
    downloadPdfBytes(bytes, fileName);
  }
}
