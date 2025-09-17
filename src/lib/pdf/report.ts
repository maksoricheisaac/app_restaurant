import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { downloadPdfBytes } from './utils';

export interface ReportData {
  revenue: number;
  orders: number;
  customers: number;
  avgOrder: number;
  topDishes: Array<{ name: string; orders: number }>;
  period: {
    start: Date;
    end: Date;
    type: string;
  };
}

export async function generateSalesReportPdf(data: ReportData, chartData: Array<{ date: string; revenue: number; orders: number }>, formatPrice: (n: number) => string) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let page = pdf.addPage([595.28, 841.89]); // A4 in pt
  let { width, height } = page.getSize();
  let y = height - 50;

  const lh = (s: number) => s * 1.3;
  const text = (t: string, x: number, yy: number, s: number, b = false) => page.drawText(t, { x, y: yy, size: s, font: b ? bold : font, color: rgb(0,0,0) });
  const rule = (yy: number) => page.drawLine({ start: { x: 40, y: yy }, end: { x: width - 40, y: yy }, thickness: 1, color: rgb(0.85,0.85,0.85) });

  // Title
  text('Rapport de vente', 40, y, 22, true);
  y -= lh(22);
  text(`Période: ${data.period.type}`, 40, y, 12);
  y -= lh(12);
  text(`Du: ${data.period.start.toLocaleDateString('fr-FR')}  Au: ${data.period.end.toLocaleDateString('fr-FR')}`, 40, y, 12);
  y -= lh(12) + 10;
  rule(y);
  y -= 15;

  // Metrics
  text('Métriques clés', 40, y, 16, true);
  y -= lh(16) + 5;
  text(`Revenus totaux: ${formatPrice(data.revenue)}`, 40, y, 12);
  y -= lh(12);
  text(`Nombre de commandes: ${data.orders}`, 40, y, 12);
  y -= lh(12);
  text(`Clients uniques: ${data.customers}`, 40, y, 12);
  y -= lh(12);
  text(`Panier moyen: ${formatPrice(data.avgOrder)}`, 40, y, 12);
  y -= lh(12) + 10;

  // Top dishes
  text('Plats les plus vendus', 40, y, 16, true);
  y -= lh(16) + 5;
  data.topDishes.forEach((dish) => {
    text(`${dish.name}: ${dish.orders}`, 40, y, 12);
    y -= lh(12) - 2;
  });
  y -= 10;

  // Chart data list
  text('Détail par période', 40, y, 16, true);
  y -= lh(16) + 5;
  for (const item of chartData) {
    if (y < 60) {
      page = pdf.addPage([595.28, 841.89]);
      ({ width, height } = page.getSize());
      y = height - 50;
    }
    text(`${item.date}: ${formatPrice(item.revenue)} - ${item.orders} commandes`, 40, y, 10);
    y -= lh(10) - 2;
  }

  const bytes = await pdf.save();
  const fileName = `rapport-vente-${data.period.type}-${new Date().toISOString().slice(0,10)}.pdf`;
  downloadPdfBytes(bytes, fileName);
}
