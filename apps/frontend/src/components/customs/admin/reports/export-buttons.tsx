"use client";

import { Button } from "@/components/ui/button";
import { FileText, FileSpreadsheet } from "lucide-react";
import { generateSalesReportPdf } from "@/lib/pdf/report";
import { toast } from "sonner";

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
      toast.loading('Génération du PDF en cours...');
      await generateSalesReportPdf(data, chartData, formatPrice);
      toast.dismiss();
      toast.success('Rapport PDF généré avec succès !');
    } catch (e) {
      toast.dismiss();
      console.error('Erreur lors de la génération du rapport PDF:', e);
      toast.error('Erreur lors de la génération du PDF');
    }
  };

  const exportToCSV = () => {
    try {
      toast.loading('Génération du CSV en cours...');
      
      // Fonction pour échapper les valeurs CSV
      const escapeCSV = (value: string | number): string => {
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

    // Labels de période
    const periodLabels: Record<string, string> = {
      daily: 'Journalier',
      weekly: 'Hebdomadaire',
      monthly: 'Mensuel',
      yearly: 'Annuel'
    };

    let csvContent = '\uFEFF'; // BOM UTF-8 pour Excel
    
    // ===== SECTION 1: INFORMATIONS GÉNÉRALES =====
    csvContent += '=== RAPPORT DE VENTES ===\n';
    csvContent += `Généré le,${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}\n`;
    csvContent += `Type de période,${periodLabels[data.period.type] || data.period.type}\n`;
    csvContent += `Du,${new Date(data.period.start).toLocaleDateString('fr-FR')}\n`;
    csvContent += `Au,${new Date(data.period.end).toLocaleDateString('fr-FR')}\n`;
    csvContent += '\n';

    // ===== SECTION 2: MÉTRIQUES CLÉS =====
    csvContent += '=== MÉTRIQUES CLÉS ===\n';
    csvContent += 'Indicateur,Valeur\n';
    csvContent += `Revenus totaux (FCFA),${data.revenue}\n`;
    csvContent += `Nombre de commandes,${data.orders}\n`;
    csvContent += `Clients uniques,${data.customers}\n`;
    csvContent += `Panier moyen (FCFA),${data.avgOrder.toFixed(2)}\n`;
    csvContent += '\n';

    // ===== SECTION 3: PLATS LES PLUS VENDUS =====
    csvContent += '=== PLATS LES PLUS VENDUS ===\n';
    csvContent += 'Rang,Plat,Quantité vendue\n';
    
    if (data.topDishes && data.topDishes.length > 0) {
      data.topDishes.forEach((dish, index) => {
        csvContent += `${index + 1},${escapeCSV(dish.name)},${dish.orders}\n`;
      });
    } else {
      csvContent += 'Aucune donnée disponible\n';
    }
    csvContent += '\n';

    // ===== SECTION 4: DÉTAIL PAR PÉRIODE =====
    csvContent += '=== DÉTAIL PAR PÉRIODE ===\n';
    csvContent += 'Date,Revenus (FCFA),Nombre de commandes\n';
    
    if (chartData && chartData.length > 0) {
      // Trier les données par date
      const sortedData = [...chartData].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      });

      sortedData.forEach(item => {
        csvContent += `${escapeCSV(item.date)},${item.revenue},${item.orders}\n`;
      });

      // ===== SECTION 5: STATISTIQUES SUPPLÉMENTAIRES =====
      csvContent += '\n';
      csvContent += '=== STATISTIQUES SUPPLÉMENTAIRES ===\n';
      
      const totalRevenue = sortedData.reduce((sum, item) => sum + item.revenue, 0);
      const totalOrders = sortedData.reduce((sum, item) => sum + item.orders, 0);
      const avgRevenue = totalRevenue / sortedData.length;
      const avgOrders = totalOrders / sortedData.length;
      const maxRevenue = Math.max(...sortedData.map(item => item.revenue));
      const minRevenue = Math.min(...sortedData.map(item => item.revenue));
      const maxOrders = Math.max(...sortedData.map(item => item.orders));
      const minOrders = Math.min(...sortedData.map(item => item.orders));

      csvContent += 'Indicateur,Valeur\n';
      csvContent += `Revenus total période (FCFA),${totalRevenue}\n`;
      csvContent += `Commandes total période,${totalOrders}\n`;
      csvContent += `Revenus moyen par jour (FCFA),${avgRevenue.toFixed(2)}\n`;
      csvContent += `Commandes moyen par jour,${avgOrders.toFixed(2)}\n`;
      csvContent += `Revenus maximum (FCFA),${maxRevenue}\n`;
      csvContent += `Revenus minimum (FCFA),${minRevenue}\n`;
      csvContent += `Commandes maximum,${maxOrders}\n`;
      csvContent += `Commandes minimum,${minOrders}\n`;
    } else {
      csvContent += 'Aucune donnée disponible\n';
    }

      // ===== TÉLÉCHARGEMENT =====
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const fileName = `rapport-ventes-${data.period.type}-${new Date().toISOString().split('T')[0]}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.dismiss();
      toast.success('Rapport CSV généré avec succès !');
    } catch (error) {
      toast.dismiss();
      console.error('Erreur lors de la génération du CSV:', error);
      toast.error('Erreur lors de la génération du CSV');
    }
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
 