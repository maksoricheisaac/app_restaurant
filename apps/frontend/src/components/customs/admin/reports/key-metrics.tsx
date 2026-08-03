import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Users, ShoppingCart, BarChart3 } from "lucide-react";

/**
 * Contrat renvoyé par `GET /reports/metrics`.
 *
 * Cet écran lisait auparavant `report.revenue` et `report.orders` comme des
 * nombres alors que l'API renvoie des objets — le chiffre d'affaires
 * s'affichait donc en « [object Object] » et le compteur de commandes faisait
 * échouer le rendu React. Le type reflète désormais la réponse réelle.
 */
export interface ReportMetrics {
  orders: {
    total: number;
    byStatus: Record<string, number>;
  };
  revenue: {
    /** Commandes de la période effectivement réglées. */
    collected: number;
    /** Commandes passées, réglées ou non. */
    ordered: number;
    /** Reste à encaisser sur la période. */
    outstanding: number;
    paidOrderCount: number;
    averageTicket: number;
  };
  customers: { new: number };
  reservations: { total: number };
  period: { start: string | Date; end: string | Date; type: string };
}

interface KeyMetricsProps {
  latestReport: ReportMetrics | undefined;
  formatPrice: (price: number | undefined) => string;
}

export function KeyMetrics({ latestReport, formatPrice }: KeyMetricsProps) {
  const revenue = latestReport?.revenue;
  const outstanding = revenue?.outstanding ?? 0;
  const paidCount = revenue?.paidOrderCount ?? 0;
  const reservations = latestReport?.reservations?.total ?? 0;

  const metrics = [
    {
      label: "Chiffre d'affaires encaissé",
      value: formatPrice(revenue?.collected),
      hint:
        outstanding > 0
          ? `${formatPrice(outstanding)} restant à encaisser`
          : "tout est encaissé",
      icon: <DollarSign className="h-6 w-6 text-green-600" />,
      iconBg: "bg-green-100",
    },
    {
      label: "Commandes",
      value: String(latestReport?.orders?.total ?? 0),
      hint: `${paidCount} réglée${paidCount > 1 ? "s" : ""}`,
      icon: <ShoppingCart className="h-6 w-6 text-blue-600" />,
      iconBg: "bg-blue-100",
    },
    {
      label: "Nouveaux clients",
      value: String(latestReport?.customers?.new ?? 0),
      hint: `${reservations} réservation${reservations > 1 ? "s" : ""}`,
      icon: <Users className="h-6 w-6 text-purple-600" />,
      iconBg: "bg-purple-100",
    },
    {
      label: "Panier moyen",
      value: formatPrice(revenue?.averageTicket),
      hint: "sur les commandes réglées",
      icon: <BarChart3 className="h-6 w-6 text-orange-600" />,
      iconBg: "bg-orange-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric) => (
        <Card key={metric.label} className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                <p className="text-3xl font-bold text-gray-900 tabular-nums">
                  {metric.value}
                </p>
                <p className="text-xs text-gray-500 mt-1">{metric.hint}</p>
              </div>
              <div className={`${metric.iconBg} p-3 rounded-xl shrink-0`}>
                {metric.icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
