"use client";

import { CashRegisterStats } from "@/types/order";
import { DollarSign } from "lucide-react";

interface PaymentMethodsChartProps {
  stats: CashRegisterStats | null;
}

export function PaymentMethodsChart({ stats }: PaymentMethodsChartProps) {
  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Aucune donnée disponible</p>
      </div>
    );
  }

  const paymentMethods = [
    {
      key: "cash",
      label: "Espèces",
      icon: DollarSign,
      color: "bg-green-500",
      textColor: "text-green-600",
    },
  ];

  const totalSales = stats.totalSales;
  const methodsData = paymentMethods.map(method => ({
    ...method,
    amount: stats.salesByMethod[method.key as keyof typeof stats.salesByMethod] || 0,
    percentage: totalSales > 0 ? (stats.salesByMethod[method.key as keyof typeof stats.salesByMethod] || 0) / totalSales * 100 : 0,
  })).filter(method => method.amount > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Ventes en espèces</h3>
        <div className="text-sm text-gray-500">
          Total: {new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "XAF",
          }).format(totalSales)}
        </div>
      </div>

      <div className="space-y-4">
        {methodsData.map((method) => (
          <div key={method.key} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${method.color} bg-opacity-10`}>
                  <method.icon className={`w-4 h-4 ${method.textColor}`} />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{method.label}</div>
                  <div className="text-sm text-gray-500">
                    {method.percentage.toFixed(1)}% du total
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">
                  {new Intl.NumberFormat("fr-FR", {
                    style: "currency",
                    currency: "XAF",
                  }).format(method.amount)}
                </div>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${method.color}`}
                style={{ width: `${method.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {methodsData.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"/>
          <p className="text-gray-500">Aucune transaction enregistrée</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {methodsData.length}
          </div>
          <div className="text-sm text-gray-500">Méthode utilisée</div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {new Intl.NumberFormat("fr-FR", {
              style: "currency",
              currency: "XAF",
            }).format(methodsData.length > 0 ? methodsData[0].amount : 0)}
          </div>
          <div className="text-sm text-gray-500">Montant espèces</div>
        </div>
      </div>
    </div>
  );
} 