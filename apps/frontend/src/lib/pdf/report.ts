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

export async function generateSalesReportPdf(
  data: ReportData, 
  chartData: Array<{ date: string; revenue: number; orders: number }>, 
  formatPrice: (n: number) => string
) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let page = pdf.addPage([595.28, 841.89]); // A4 en points
  let { width, height } = page.getSize();
  let y = height - 40;

  // Couleurs
  const primaryColor = rgb(0.95, 0.45, 0.13); // Orange #F27221
  const darkColor = rgb(0.2, 0.2, 0.2);
  const lightGray = rgb(0.95, 0.95, 0.95);
  const mediumGray = rgb(0.7, 0.7, 0.7);
  
  // Fonction pour dessiner du texte
  const text = (t: string, x: number, yy: number, s: number, b = false, color = darkColor) => {
    page.drawText(t, { 
      x, 
      y: yy, 
      size: s, 
      font: b ? bold : font, 
      color 
    });
  };

  // Fonction pour dessiner une ligne
  const rule = (yy: number, thickness = 1, color = mediumGray) => {
    page.drawLine({ 
      start: { x: 50, y: yy }, 
      end: { x: width - 50, y: yy }, 
      thickness, 
      color 
    });
  };

  // Fonction pour dessiner un rectangle
  const rect = (x: number, yy: number, w: number, h: number, color: ReturnType<typeof rgb>) => {
    page.drawRectangle({ x, y: yy, width: w, height: h, color });
  };

  // ===== EN-TÊTE STYLISÉ =====
  // Bandeau orange
  rect(0, height - 80, width, 80, primaryColor);
  
  // Titre principal
  text('RAPPORT DE VENTES', 50, height - 45, 24, true, rgb(1, 1, 1));
  text('Analyse des performances', 50, height - 65, 12, false, rgb(1, 1, 1));
  
  // Date de génération
  const now = new Date();
  text(`Généré le ${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR')}`, 
    width - 220, height - 55, 9, false, rgb(1, 1, 1));

  y = height - 100;

  // ===== PÉRIODE =====
  rect(50, y - 35, width - 100, 35, lightGray);
  text('PÉRIODE D\'ANALYSE', 60, y - 15, 11, true, primaryColor);
  
  const periodLabels: Record<string, string> = {
    daily: 'Journalier',
    weekly: 'Hebdomadaire',
    monthly: 'Mensuel',
    yearly: 'Annuel'
  };
  
  text(`Type: ${periodLabels[data.period.type] || data.period.type}`, 60, y - 28, 10);
  text(`Du ${data.period.start.toLocaleDateString('fr-FR')} au ${data.period.end.toLocaleDateString('fr-FR')}`, 
    250, y - 28, 10);
  
  y -= 55;

  // ===== MÉTRIQUES CLÉS =====
  text('MÉTRIQUES CLÉS', 50, y, 14, true, primaryColor);
  y -= 25;

  // Cartes de métriques (sans émojis pour compatibilité PDF)
  const metrics = [
    { label: 'Revenus totaux', value: formatPrice(data.revenue), symbol: '$' },
    { label: 'Commandes', value: data.orders.toString(), symbol: '#' },
    { label: 'Clients uniques', value: data.customers.toString(), symbol: '@' },
    { label: 'Panier moyen', value: formatPrice(data.avgOrder), symbol: '~' }
  ];

  const cardWidth = (width - 140) / 2;
  const cardHeight = 60;
  let cardX = 50;
  let cardY = y;

  metrics.forEach((metric, index) => {
    if (index === 2) {
      cardX = 50;
      cardY -= cardHeight + 10;
    }

    // Fond de carte
    rect(cardX, cardY - cardHeight, cardWidth, cardHeight, lightGray);
    
    // Symbole et label
    text(metric.symbol, cardX + 10, cardY - 20, 16, true, primaryColor);
    text(metric.label, cardX + 40, cardY - 20, 10, false, mediumGray);
    
    // Valeur
    text(metric.value, cardX + 40, cardY - 45, 16, true, darkColor);

    cardX += cardWidth + 20;
  });

  y = cardY - cardHeight - 30;

  // ===== PLATS LES PLUS VENDUS =====
  if (y < 200) {
    page = pdf.addPage([595.28, 841.89]);
    ({ width, height } = page.getSize());
    y = height - 50;
  }

  text('PLATS LES PLUS VENDUS', 50, y, 14, true, primaryColor);
  y -= 20;
  rule(y, 2, primaryColor);
  y -= 15;

  // Tableau des plats
  if (data.topDishes && data.topDishes.length > 0) {
    // En-têtes du tableau
    rect(50, y - 25, width - 100, 25, lightGray);
    text('Plat', 60, y - 15, 10, true);
    text('Quantité vendue', width - 200, y - 15, 10, true);
    y -= 30;

    data.topDishes.forEach((dish, index) => {
      if (y < 60) {
        page = pdf.addPage([595.28, 841.89]);
        ({ width, height } = page.getSize());
        y = height - 50;
      }

      // Ligne alternée
      if (index % 2 === 0) {
        rect(50, y - 20, width - 100, 20, rgb(0.98, 0.98, 0.98));
      }

      text(`${index + 1}. ${dish.name}`, 60, y - 12, 10);
      text(dish.orders.toString(), width - 180, y - 12, 10, true, primaryColor);
      
      y -= 22;
    });
  } else {
    text('Aucune donnée disponible', 60, y - 12, 10, false, mediumGray);
    y -= 25;
  }

  y -= 20;

  // ===== DÉTAIL PAR PÉRIODE =====
  if (y < 200) {
    page = pdf.addPage([595.28, 841.89]);
    ({ width, height } = page.getSize());
    y = height - 50;
  }

  text('DÉTAIL PAR PÉRIODE', 50, y, 14, true, primaryColor);
  y -= 20;
  rule(y, 2, primaryColor);
  y -= 15;

  if (chartData && chartData.length > 0) {
    // En-têtes du tableau
    rect(50, y - 25, width - 100, 25, lightGray);
    text('Date', 60, y - 15, 10, true);
    text('Revenus', 250, y - 15, 10, true);
    text('Commandes', width - 150, y - 15, 10, true);
    y -= 30;

    chartData.forEach((item, index) => {
      if (y < 60) {
        page = pdf.addPage([595.28, 841.89]);
        ({ width, height } = page.getSize());
        y = height - 50;
      }

      // Ligne alternée
      if (index % 2 === 0) {
        rect(50, y - 20, width - 100, 20, rgb(0.98, 0.98, 0.98));
      }

      text(item.date, 60, y - 12, 9);
      text(formatPrice(item.revenue), 250, y - 12, 9);
      text(item.orders.toString(), width - 130, y - 12, 9, false, primaryColor);
      
      y -= 22;
    });
  } else {
    text('Aucune donnée disponible', 60, y - 12, 10, false, mediumGray);
  }

  // ===== PIED DE PAGE =====
  const footerY = 30;
  rule(footerY + 10, 1, mediumGray);
  text('Document confidentiel - Usage interne uniquement', 50, footerY, 8, false, mediumGray);
  text(`Page 1/${pdf.getPageCount()}`, width - 100, footerY, 8, false, mediumGray);

  const bytes = await pdf.save();
  const fileName = `rapport-ventes-${data.period.type}-${new Date().toISOString().slice(0, 10)}.pdf`;
  downloadPdfBytes(bytes, fileName);
}
