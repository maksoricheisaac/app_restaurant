import { Users, ShoppingBag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface CustomerStatsProps {
  totalCustomers: number;
  activeCustomers: number;
}

export function CustomerStats({
  totalCustomers,
  activeCustomers,
}: CustomerStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900">{totalCustomers}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Clients Actifs</p>
              <p className="text-2xl font-bold text-gray-900">{activeCustomers}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <ShoppingBag className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Clients VIP</p>
              <p className="text-2xl font-bold text-gray-900">{vipCustomers}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Star className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
} 