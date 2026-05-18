"use client";

import { CashRegisterStats } from "@/types/order";

interface SalesChartProps {
  stats: CashRegisterStats | null;
}

export function SalesChart({ stats }: SalesChartProps) {
  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Aucune donnée disponible</p>
      </div>
    );
  }

  // Préparer les données pour le graphique
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
  const salesData = hours.map(hour => ({
    hour,
    sales: stats.salesByHour[hour] || 0
  }));

  const maxSales = Math.max(...salesData.map(d => d.sales));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Ventes par heure</h3>
        <div className="text-sm text-gray-500">
          Total: {new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "XAF",
          }).format(stats.totalSales)}
        </div>
      </div>

      <div className="h-64 flex items-end justify-between gap-1">
        {salesData.map((data, index) => {
          const height = maxSales > 0 ? (data.sales / maxSales) * 100 : 0;
          const isCurrentHour = new Date().getHours().toString().padStart(2, "0") === data.hour;
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="w-full flex flex-col items-center">
                <div 
                  className={`w-full rounded-t transition-all duration-300 ${
                    isCurrentHour 
                      ? "bg-blue-500" 
                      : data.sales > 0 
                        ? "bg-green-500" 
                        : "bg-gray-200"
                  }`}
                  style={{ height: `${Math.max(height, 2)}%` }}
                />
                <div className="text-xs text-gray-500 mt-1 transform rotate-45 origin-left">
                  {data.hour}h
                </div>
              </div>
              {data.sales > 0 && (
                <div className="text-xs text-gray-600 mt-1 text-center">
                  {new Intl.NumberFormat("fr-FR", {
                    style: "currency",
                    currency: "XAF",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(data.sales)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Ventes</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>Heure actuelle</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-200 rounded"></div>
          <span>Aucune vente</span>
        </div>
      </div>
    </div>
  );
} 