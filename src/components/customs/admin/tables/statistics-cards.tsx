import { Table2, Users, ShoppingCart, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Tables</p>
              <p className="text-2xl font-bold text-gray-900">{totalTables}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Table2 className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Disponibles</p>
              <p className="text-2xl font-bold text-gray-900">{availableTables}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Occupées</p>
              <p className="text-2xl font-bold text-gray-900">{occupiedTables}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <ShoppingCart className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Capacité Totale</p>
              <p className="text-2xl font-bold text-gray-900">{totalCapacity}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 