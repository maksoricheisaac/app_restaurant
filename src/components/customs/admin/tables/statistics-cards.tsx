import { Table2, Users, ShoppingCart, Calendar } from "lucide-react";
import { ResponsiveStatCard } from "@/components/ui/responsive-stat-card";

interface StatisticsCardsProps {
  totalTables: number;
  availableTables: number;
  occupiedTables: number;
  totalCapacity: number;
}

export function StatisticsCards({
  totalTables,
  availableTables,
  occupiedTables,
  totalCapacity,
}: StatisticsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
      <ResponsiveStatCard
        label="Total Tables"
        value={totalTables}
        icon={Table2}
        iconBgColor="bg-purple-100"
        iconColor="text-purple-600"
      />
      
      <ResponsiveStatCard
        label="Disponibles"
        value={availableTables}
        icon={Users}
        iconBgColor="bg-green-100"
        iconColor="text-green-600"
      />
      
      <ResponsiveStatCard
        label="Occupées"
        value={occupiedTables}
        icon={ShoppingCart}
        iconBgColor="bg-red-100"
        iconColor="text-red-600"
      />
      
      <ResponsiveStatCard
        label="Capacité"
        value={totalCapacity}
        icon={Calendar}
        iconBgColor="bg-blue-100"
        iconColor="text-blue-600"
      />
    </div>
  );
}