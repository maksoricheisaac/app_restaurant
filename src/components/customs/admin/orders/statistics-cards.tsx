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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6">
      <Card>
        <CardContent className="pt-4 md:pt-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs md:text-sm font-medium text-gray-500 truncate">Total</p>
              <p className="text-lg md:text-2xl font-bold text-gray-900">{totalOrders}</p>
            </div>
            <div className="bg-blue-100 p-2 md:p-3 rounded-full flex-shrink-0 ml-2">
              <ShoppingBag className="h-4 w-4 md:h-6 md:w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 md:pt-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs md:text-sm font-medium text-gray-500 truncate">Attente</p>
              <p className="text-lg md:text-2xl font-bold text-gray-900">{pendingOrders}</p>
            </div>
            <div className="bg-orange-100 p-2 md:p-3 rounded-full flex-shrink-0 ml-2">
              <Clock className="h-4 w-4 md:h-6 md:w-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 md:pt-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs md:text-sm font-medium text-gray-500 truncate">Prép.</p>
              <p className="text-lg md:text-2xl font-bold text-gray-900">{preparingOrders}</p>
            </div>
            <div className="bg-yellow-100 p-2 md:p-3 rounded-full flex-shrink-0 ml-2">
              <Clock className="h-4 w-4 md:h-6 md:w-6 text-yellow-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 md:pt-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs md:text-sm font-medium text-gray-500 truncate">Terminées</p>
              <p className="text-lg md:text-2xl font-bold text-gray-900">{completedOrders}</p>
            </div>
            <div className="bg-green-100 p-2 md:p-3 rounded-full flex-shrink-0 ml-2">
              <CheckCircle className="h-4 w-4 md:h-6 md:w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-2 md:col-span-1">
        <CardContent className="pt-4 md:pt-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs md:text-sm font-medium text-gray-500 truncate">CA</p>
              <p className="text-lg md:text-2xl font-bold text-gray-900 truncate">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="bg-emerald-100 p-2 md:p-3 rounded-full flex-shrink-0 ml-2">
              <DollarSign className="h-4 w-4 md:h-6 md:w-6 text-emerald-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}