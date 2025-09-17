"use client";

import { Button } from "@/components/ui/button";
import { FileText, FileSpreadsheet } from "lucide-react";
import { generateSalesReportPdf } from "@/lib/pdf/report";

interface ExportData {
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

interface ExportButtonsProps {
  data: ExportData;
  chartData: Array<{ date: string; revenue: number; orders: number }>;
  formatPrice: (price: number) => string;
}

export function ExportButtons({ data, chartData, formatPrice }: ExportButtonsProps) {
  const exportToPDF = async () => {
    try {
      await generateSalesReportPdf(data, chartData, formatPrice);
    } catch (e) {
      console.error('Erreur lors de la génération du rapport PDF:', e);
    }
  };

  const exportToCSV = () => {
    // En-têtes
    const headers = [
      'Date',
      'Revenus (FCFA)',
      'Nombre de commandes',
      'Clients uniques',
      'Panier moyen (FCFA)'
    ];
    
    // Données du graphique
    const csvData = chartData.map(item => [
      item.date,
      item.revenue,
      item.orders,
      data.customers,
      data.avgOrder
    ]);
    
    // Ajouter les plats les plus vendus
    const dishesHeaders = ['Plat', 'Quantité vendue'];
    const dishesData = data.topDishes.map(dish => [dish.name, dish.orders]);
    
    // Créer le contenu CSV
    let csvContent = headers.join(',') + '\n';
    csvContent += csvData.map(row => row.join(',')).join('\n');
    csvContent += '\n\nPlats les plus vendus\n';
    csvContent += dishesHeaders.join(',') + '\n';
    csvContent += dishesData.map(row => row.join(',')).join('\n');
    
    // Créer et télécharger le fichier
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `rapport-vente-${data.period.type}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex gap-2">
      <Button onClick={exportToPDF} variant="outline" size="sm">
        <FileText className="h-4 w-4 mr-2" />
        Exporter PDF
      </Button>
      <Button onClick={exportToCSV} variant="outline" size="sm">
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        Exporter CSV
      </Button>
    </div>
  );
}
 