import { Card, CardContent } from "@/components/ui/card";
import { ManagerOrAdmin } from "@/components/admin/RoleGuard";
import { 
  ShoppingCart, 
  DollarSign, 
  Users,
  Calendar
} from "lucide-react";

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
  return (
    <ManagerOrAdmin>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <Card>
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm font-medium text-gray-500 truncate">Commandes</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">
                  {isLoading ? "..." : statsData?.totalOrders || 0}
                </p>
              </div>
              <div className="bg-orange-100 p-2 md:p-3 rounded-full flex-shrink-0 ml-2">
                <ShoppingCart className="h-4 w-4 md:h-6 md:w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm font-medium text-gray-500 truncate">Revenus</p>
                <p className="text-sm md:text-2xl font-bold text-gray-900 truncate">
                  {isLoading ? "..." : statsData?.totalRevenue ? `${statsData.totalRevenue.toLocaleString()}` : "0"}
                  <span className="text-xs md:text-sm font-normal text-gray-500 ml-1">FCFA</span>
                </p>
              </div>
              <div className="bg-green-100 p-2 md:p-3 rounded-full flex-shrink-0 ml-2">
                <DollarSign className="h-4 w-4 md:h-6 md:w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm font-medium text-gray-500 truncate">Clients</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">
                  {isLoading ? "..." : statsData?.activeCustomers || 0}
                </p>
              </div>
              <div className="bg-blue-100 p-2 md:p-3 rounded-full flex-shrink-0 ml-2">
                <Users className="h-4 w-4 md:h-6 md:w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs md:text-sm font-medium text-gray-500 truncate">Réservations</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900">
                  {isLoading ? "..." : statsData?.totalReservations || 0}
                </p>
              </div>
              <div className="bg-purple-100 p-2 md:p-3 rounded-full flex-shrink-0 ml-2">
                <Calendar className="h-4 w-4 md:h-6 md:w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ManagerOrAdmin>
  );
}