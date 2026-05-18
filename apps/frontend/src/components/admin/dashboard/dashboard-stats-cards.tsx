import { StatsCard } from "@/components/ui/stats-card";
import { ManagerOrAdmin } from "@/components/admin/RoleGuard";
import { ShoppingCart, TrendingUp, Users, CalendarCheck } from "lucide-react";

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  activeCustomers: number;
  totalReservations: number;
}

interface DashboardStatsCardsProps {
  statsData: DashboardStats | undefined;
  isLoading: boolean;
}

export function DashboardStatsCards({ statsData, isLoading }: DashboardStatsCardsProps) {
  const revenueFormatted = isLoading
    ? "—"
    : (statsData?.totalRevenue ?? 0).toLocaleString("fr-FR") + " FCFA";

  return (
    <ManagerOrAdmin>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Commandes"
          value={statsData?.totalOrders ?? 0}
          icon={<ShoppingCart className="h-5 w-5" />}
          variant="orange"
          subtitle="aujourd'hui"
          isLoading={isLoading}
        />
        <StatsCard
          title="Chiffre d'affaires"
          value={revenueFormatted}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="green"
          subtitle="aujourd'hui"
          isLoading={isLoading}
        />
        <StatsCard
          title="Clients actifs"
          value={statsData?.activeCustomers ?? 0}
          icon={<Users className="h-5 w-5" />}
          variant="blue"
          subtitle="ce mois"
          isLoading={isLoading}
        />
        <StatsCard
          title="Réservations"
          value={statsData?.totalReservations ?? 0}
          icon={<CalendarCheck className="h-5 w-5" />}
          variant="purple"
          subtitle="à venir"
          isLoading={isLoading}
        />
      </div>
    </ManagerOrAdmin>
  );
}