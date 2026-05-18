/* eslint-disable react/no-unescaped-entities */
import { Card, CardContent } from "@/components/ui/card";
import {
  DollarSign,
  Users,
  ShoppingCart,
  BarChart3,
} from "lucide-react";

interface Report {
  revenue: number;
  orders: number;
  customers: number;
  avgOrder: number;
  topDishes: Array<{
    name: string;
    orders: number;
  }>;
  period: {
    start: Date;
    end: Date;
    type: string;
  };
}

interface KeyMetricsProps {
  latestReport: Report | undefined;
  formatPrice: (price: number | undefined) => string;
}

export function KeyMetrics({ latestReport, formatPrice }: KeyMetricsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="shadow-lg border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Chiffre d'Affaires</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatPrice(latestReport?.revenue)}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-xl">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Commandes</p>
              <p className="text-3xl font-bold text-gray-900">
                {latestReport?.orders || 0}
              </p>
            </div>
            <div className="bg-blue-100 p-3 rounded-xl">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Clients</p>
              <p className="text-3xl font-bold text-gray-900">
                {latestReport?.customers || 0}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-xl">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Panier Moyen</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatPrice(latestReport?.avgOrder)}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-xl">
              <BarChart3 className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 