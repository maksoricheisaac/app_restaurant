import { StatsCard } from "@/components/ui/stats-card";
import { ShoppingBag, Clock, ChefHat, CheckCircle, TrendingUp } from "lucide-react";

interface StatisticsCardsProps {
  totalOrders: number;
  pendingOrders: number;
  preparingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  formatCurrency: (amount: number) => string;
}

export function StatisticsCards({
  totalOrders,
  pendingOrders,
  preparingOrders,
  completedOrders,
  totalRevenue,
  formatCurrency,
}: StatisticsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      <StatsCard
        title="Total commandes"
        value={totalOrders}
        icon={<ShoppingBag className="h-5 w-5" />}
        variant="slate"
      />
      <StatsCard
        title="En attente"
        value={pendingOrders}
        icon={<Clock className="h-5 w-5" />}
        variant="amber"
      />
      <StatsCard
        title="En préparation"
        value={preparingOrders}
        icon={<ChefHat className="h-5 w-5" />}
        variant="blue"
      />
      <StatsCard
        title="Terminées"
        value={completedOrders}
        icon={<CheckCircle className="h-5 w-5" />}
        variant="green"
      />
      <StatsCard
        title="CA du jour"
        value={formatCurrency(totalRevenue)}
        icon={<TrendingUp className="h-5 w-5" />}
        variant="emerald"
        className="col-span-2 md:col-span-1"
      />
    </div>
  );
}