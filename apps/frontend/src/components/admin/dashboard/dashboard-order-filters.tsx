import { Button } from "@/components/ui/button";
import { OrderStatus } from '@/types/order';

interface DashboardOrderFiltersProps {
  orderStatus: OrderStatus | undefined;
  onStatusChange: (status: OrderStatus | undefined) => void;
}

export function DashboardOrderFilters({ orderStatus, onStatusChange }: DashboardOrderFiltersProps) {
  return (
    <div className="grid grid-cols-2 sm:flex gap-2">
      <Button
        variant={!orderStatus ? "secondary" : "outline"}
        size="sm"
        className="w-full sm:w-auto"
        onClick={() => onStatusChange(undefined)}
      >
        Toutes
      </Button>
      <Button
        variant={orderStatus === "pending" ? "secondary" : "outline"}
        size="sm"
        className="w-full sm:w-auto"
        onClick={() => onStatusChange("pending")}
      >
        <span className="hidden sm:inline">En </span>attente
      </Button>
      <Button
        variant={orderStatus === "preparing" ? "secondary" : "outline"}
        size="sm"
        className="w-full sm:w-auto"
        onClick={() => onStatusChange("preparing")}
      >
        <span className="hidden sm:inline">En </span>préparation
      </Button>
      <Button
        variant={orderStatus === "ready" ? "secondary" : "outline"}
        size="sm"
        className="w-full sm:w-auto"
        onClick={() => onStatusChange("ready")}
      >
        Prêtes
      </Button>
      <Button
        variant={orderStatus === "served" ? "secondary" : "outline"}
        size="sm"
        className="w-full sm:w-auto"
        onClick={() => onStatusChange("served")}
      >
        Servies
      </Button>
    </div>
  );
}