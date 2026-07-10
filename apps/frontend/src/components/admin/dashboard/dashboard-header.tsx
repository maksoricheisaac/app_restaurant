import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Shield, Wifi } from "lucide-react";
import { useRole } from "@/hooks/useRole";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function DashboardHeader() {
  const { user, isAdmin } = useRole();
  const today = format(new Date(), "EEEE d MMMM yyyy", { locale: fr });
  const capitalizedDate = today.charAt(0).toUpperCase() + today.slice(1);

  return (
    <PageHeader
      title="Tableau de bord"
      subtitle={`Bonjour ${user?.name ?? ""} — ${capitalizedDate}`}
      badge={
        <div className="flex items-center gap-2">
          <Badge
            variant={isAdmin ? "default" : "secondary"}
            className="gap-1"
          >
            <Shield className="h-3 w-3" />
            {isAdmin ? "Administrateur" : "Manager"}
          </Badge>
          <Badge
            variant="outline"
            className="gap-1 border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-400"
          >
            <Wifi className="h-3 w-3" />
            En ligne
          </Badge>
        </div>
      }
    />
  );
}