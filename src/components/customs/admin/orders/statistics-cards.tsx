import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag, Clock, CheckCircle, DollarSign } from "lucide-react";

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
  formatCurrency
}: StatisticsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Commandes</p>
              <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <ShoppingBag className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">En attente</p>
              <p className="text-2xl font-bold text-gray-900">{pendingOrders}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">En préparation</p>
              <p className="text-2xl font-bold text-gray-900">{preparingOrders}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Terminées</p>
              <p className="text-2xl font-bold text-gray-900">{completedOrders}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Chiffre d&apos;affaires</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="bg-emerald-100 p-3 rounded-full">
              <DollarSign className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 