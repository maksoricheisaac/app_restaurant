import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { downloadPdfBytes, mmToPt } from './utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { CashDailySummary } from '@/types/order';

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF' })
    .format(Math.round(n))
    .replace(/\u202f/g, ' '); // Replace narrow no-break space with a regular space for PDF encoding

export async function generateDailyCashSummaryPdf(
  summary: CashDailySummary,
  opts?: { fileName?: string; openInsteadOfDownload?: boolean }
) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const page = pdf.addPage([mmToPt(210), mmToPt(297)]); // A4
  const { width, height } = page.getSize();
  const margin = mmToPt(15);

  // 🎨 Colors
  const colors = {
    primary: rgb(0.1, 0.1, 0.1), // Dark gray
    secondary: rgb(0.4, 0.4, 0.4), // Medium gray
    accent: rgb(0.22, 0.6, 0.85), // Blue
    background: rgb(0.95, 0.95, 0.95), // Light gray
    white: rgb(1, 1, 1),
    success: rgb(0.1, 0.6, 0.1),
    danger: rgb(0.8, 0.1, 0.1),
  };

  let y = height - margin;

  // --- HEADER ---
  const logoSize = mmToPt(20);

  // Logo carré
  page.drawRectangle({
    x: margin,
    y: y - logoSize,
    width: logoSize,
    height: logoSize,
    color: colors.accent,
  });

  // Texte LOGO dans le carré
  page.drawText('LOGO', {
    x: margin + mmToPt(4),
    y: y - mmToPt(13),
    font: bold,
    size: 12,
    color: colors.white,
  });

  // Infos Restaurant à droite du logo
  const appX = margin + logoSize + mmToPt(10);
  page.drawText('APP RESTAURANT', {
    x: appX,
    y: y - mmToPt(5),
    font: bold,
    size: 18,
    color: colors.primary,
  });
  page.drawText('Brazzaville, Congo', {
    x: appX,
    y: y - mmToPt(13),
    font: font,
    size: 10,
    color: colors.secondary,
  });

  // Décalage vertical après bloc logo + app
  y -= mmToPt(35);

  // Document Title aligné à droite
  const title = 'Bilan de Caisse Journalier';
  const titleWidth = bold.widthOfTextAtSize(title, 22);
  page.drawText(title, {
    x: width - margin - titleWidth,
    y: y,
    font: bold,
    size: 22,
    color: colors.primary,
  });

  // Date en dessous
  y -= mmToPt(10);
  const formattedDate = format(new Date(summary.date + 'T00:00:00'), 'EEEE dd MMMM yyyy', { locale: fr });
  const dateWidth = font.widthOfTextAtSize(formattedDate, 12);
  page.drawText(formattedDate, {
    x: width - margin - dateWidth,
    y: y,
    font: font,
    size: 12,
    color: colors.secondary,
  });

  // Décalage avant le contenu
  y -= mmToPt(25);

  // --- Résumé ---
  page.drawText('Résumé de la journée', {
    x: margin,
    y,
    font: bold,
    size: 16,
    color: colors.primary,
  });
  y -= mmToPt(12);

  const kpiCardWidth = (width - 2 * margin - mmToPt(10)) / 2;
  const kpiCardHeight = mmToPt(30);

  const drawKpiCard = (x: number, y: number, title: string, value: string, color = colors.white) => {
    page.drawRectangle({
      x,
      y,
      width: kpiCardWidth,
      height: kpiCardHeight,
      color,
      borderColor: colors.background,
      borderWidth: 1,
    });
    page.drawText(title, {
      x: x + mmToPt(5),
      y: y + kpiCardHeight - mmToPt(10),
      font: font,
      size: 12,
      color: colors.secondary,
    });
    page.drawText(value, {
      x: x + mmToPt(5),
      y: y + mmToPt(5),
      font: bold,
      size: 16,
      color: colors.primary,
    });
  };

  // KPI Cards - Ligne 1
  drawKpiCard(margin, y, 'Commandes servies', `${summary.servedOrdersCount}`);
  drawKpiCard(margin + kpiCardWidth + mmToPt(10), y, 'Montant attendu', fmt(summary.expectedAmount));
  y -= kpiCardHeight + mmToPt(8);

  // Ligne 2
  drawKpiCard(margin, y, 'Montant reçu (espèces)', fmt(summary.receivedCash));
  drawKpiCard(margin + kpiCardWidth + mmToPt(10), y, 'Monnaie remise', fmt(summary.changeGiven));
  y -= kpiCardHeight + mmToPt(8);

  // Variance (Ligne 3 - pleine largeur)
  const varianceText = `${fmt(summary.variance)}`;
  const varianceLabel = summary.variance === 0 ? 'Équilibre' : summary.variance > 0 ? 'Surplus' : 'Manquant';
  let varianceColor = colors.white;
  let varianceTextColor = colors.primary;
  if (summary.variance > 0) {
    varianceColor = rgb(0.9, 1, 0.9);
    varianceTextColor = colors.success;
  } else if (summary.variance < 0) {
    varianceColor = rgb(1, 0.9, 0.9);
    varianceTextColor = colors.danger;
  }

  // Carte variance en pleine largeur
  const fullWidth = width - 2 * margin;
  page.drawRectangle({
    x: margin,
    y,
    width: fullWidth,
    height: kpiCardHeight,
    color: varianceColor,
    borderColor: colors.background,
    borderWidth: 1,
  });
  page.drawText('Écart', {
    x: margin + mmToPt(5),
    y: y + kpiCardHeight - mmToPt(10),
    font: font,
    size: 12,
    color: colors.secondary,
  });
  page.drawText(`${varianceText} (${varianceLabel})`, {
    x: margin + mmToPt(5),
    y: y + mmToPt(5),
    font: bold,
    size: 16,
    color: varianceTextColor,
  });

  // Décalage avant le footer
  y -= kpiCardHeight + mmToPt(30);

  // --- Footer ---
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1,
    color: colors.background,
  });

  y -= mmToPt(15);
  page.drawText('Signature / Cachet :', {
    x: margin,
    y,
    font: bold,
    size: 12,
    color: colors.primary,
  });

  y -= mmToPt(25);
  page.drawRectangle({
    x: margin,
    y,
    width: mmToPt(70),
    height: mmToPt(25),
    borderColor: colors.secondary,
    borderWidth: 0.5,
    borderDashArray: [3, 3],
  });

  const footerText = 'Bilan de caisse généré automatiquement par le système.';
  const footerWidth = font.widthOfTextAtSize(footerText, 8);
  page.drawText(footerText, {
    x: (width - footerWidth) / 2,
    y: margin / 2,
    font: font,
    size: 8,
    color: colors.secondary,
  });

  // --- Export ---
  const bytes = await pdf.save();
  const filename = opts?.fileName ?? `bilan-caisse_${summary.date}.pdf`;

  if (opts?.openInsteadOfDownload) {
    const arrayBuffer = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(arrayBuffer).set(bytes);
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  } else {
    downloadPdfBytes(bytes, filename);
  }
}
