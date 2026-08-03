import { StatsCard } from "@/components/ui/stats-card";
import { OwnerOrManager } from "@/components/admin/RoleGuard";
import { ShoppingCart, TrendingUp, Users, CalendarCheck } from "lucide-react";
import { useRestaurantCurrency } from "@/hooks/api/useRestaurant";

/**
 * Contrat renvoyé par `GET /dashboard/stats`.
 *
 * Les montants portent désormais leur définition dans leur nom : l'ancien
 * `totalRevenue` ne disait pas s'il s'agissait de l'encaissé ou du commandé,
 * et cet écran et celui des rapports n'en affichaient pas la même valeur.
 */
interface DashboardStats {
  ordersCount: number;
  reservationsCount: number;
  activeCustomers: number;
  /** Commandes de la journée effectivement réglées. */
  revenueCollected: number;
  /** Commandes passées, réglées ou non. */
  revenueOrdered: number;
  /** Ce qu'il reste à encaisser sur la journée. */
  revenueOutstanding: number;
}

interface DashboardStatsCardsProps {
  statsData: DashboardStats | undefined;
  isLoading: boolean;
}

export function DashboardStatsCards({ statsData, isLoading }: DashboardStatsCardsProps) {
  const formatCurrency = useRestaurantCurrency();

  const collected = statsData?.revenueCollected ?? 0;
  const outstanding = statsData?.revenueOutstanding ?? 0;

  const revenueSubtitle = isLoading
    ? "aujourd'hui"
    : outstanding > 0
      ? `${formatCurrency(outstanding)} restant à encaisser`
      : "tout est encaissé";

  return (
    <OwnerOrManager>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Commandes"
          value={statsData?.ordersCount ?? 0}
          icon={<ShoppingCart className="h-5 w-5" />}
          variant="orange"
          subtitle="aujourd'hui"
          isLoading={isLoading}
        />
        <StatsCard
          title="Chiffre d'affaires encaissé"
          value={isLoading ? "—" : formatCurrency(collected)}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="green"
          subtitle={revenueSubtitle}
          isLoading={isLoading}
        />
        <StatsCard
          title="Clients actifs"
          value={statsData?.activeCustomers ?? 0}
          icon={<Users className="h-5 w-5" />}
          variant="blue"
          subtitle="aujourd'hui"
          isLoading={isLoading}
        />
        <StatsCard
          title="Réservations"
          value={statsData?.reservationsCount ?? 0}
          icon={<CalendarCheck className="h-5 w-5" />}
          variant="purple"
          subtitle="aujourd'hui"
          isLoading={isLoading}
        />
      </div>
    </OwnerOrManager>
  );
}
