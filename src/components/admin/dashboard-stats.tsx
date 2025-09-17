import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, DollarSign, Users, Calendar } from "lucide-react";
import React from "react";

interface DashboardStatsProps {
  statsData: any;
  isLoadingStats: boolean;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ statsData, isLoadingStats }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Commandes aujourd'hui</p>
            <p className="text-2xl font-bold text-gray-900">
              {isLoadingStats ? "..." : statsData?.data?.totalOrders || 0}
            </p>
          </div>
          <div className="bg-orange-100 p-3 rounded-full">
            <ShoppingCart className="h-6 w-6 text-orange-600" />
          </div>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Revenus du jour</p>
            <p className="text-2xl font-bold text-gray-900">
              {isLoadingStats ? "..." : `${statsData?.data?.totalRevenue?.toLocaleString?.()} FCFA` || "0 FCFA"}
            </p>
          </div>
          <div className="bg-green-100 p-3 rounded-full">
            <DollarSign className="h-6 w-6 text-green-600" />
          </div>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Clients actifs</p>
            <p className="text-2xl font-bold text-gray-900">
              {isLoadingStats ? "..." : statsData?.data?.activeCustomers || 0}
            </p>
          </div>
          <div className="bg-blue-100 p-3 rounded-full">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </CardContent>
    </Card>
    {/* <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Réservations</p>
            <p className="text-2xl font-bold text-gray-900">
              {isLoadingStats ? "..." : statsData?.data?.totalReservations || 0}
            </p>
          </div>
          <div className="bg-purple-100 p-3 rounded-full">
            <Calendar className="h-6 w-6 text-purple-600" />
          </div>
        </div>
      </CardContent>
    </Card> */}
  </div>
); 