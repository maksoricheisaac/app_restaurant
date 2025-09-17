import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DollarSign, 
  CreditCard, 
  TrendingUp, 
  Receipt,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { CashRegisterStats } from "@/types/order";

interface CashRegisterStatsCardsProps {
  stats: CashRegisterStats | null;
  formatCurrency: (amount: number) => string;
  unpaidCount?: number;
}

export function CashRegisterStatsCards({ stats, formatCurrency, unpaidCount = 0 }: CashRegisterStatsCardsProps) {
  if (!stats) return null;

  const cards = [
    {
      title: "Ventes du jour",
      value: formatCurrency(stats.todaySales),
      description: `${stats.todayTransactions} transactions`,
      icon: DollarSign,
      trend: "up",
      trendValue: "+12%",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Ventes nettes",
      value: formatCurrency(stats.netSales),
      description: `Remb.: ${formatCurrency(stats.totalRefunds)} | Ajust.: ${formatCurrency(stats.totalAdjustments)}`,
      icon: TrendingUp,
      trend: "neutral",
      color: "text-emerald-700",
      bgColor: "bg-emerald-100",
    },
    {
      title: "Total des ventes",
      value: formatCurrency(stats.totalSales),
      description: `${stats.totalTransactions} transactions totales`,
      icon: TrendingUp,
      trend: "up",
      trendValue: "+8%",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Moyenne par transaction",
      value: stats.totalTransactions > 0 
        ? formatCurrency(stats.totalSales / stats.totalTransactions)
        : formatCurrency(0),
      description: "Montant moyen",
      icon: CreditCard,
      trend: "neutral",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Commandes en attente",
      value: String(unpaidCount),
      description: "En attente de paiement",
      icon: Receipt,
      trend: "down",
      trendValue: "-5%",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {card.title}
            </CardTitle>
            <div className={`p-2 rounded-full ${card.bgColor}`}>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {card.value}
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">
                {card.description}
              </p>
              {card.trend !== "neutral" && (
                <div className="flex items-center gap-1">
                  {card.trend === "up" ? (
                    <ArrowUpRight className="w-3 h-3 text-green-600" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 text-red-600" />
                  )}
                  <span className={`text-xs ${
                    card.trend === "up" ? "text-green-600" : "text-red-600"
                  }`}>
                    {card.trendValue}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 