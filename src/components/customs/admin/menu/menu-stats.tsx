import { Utensils, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface MenuStatsProps {
  totalItems: number;
  availableItems: number;
  unavailableItems: number;
}

export function MenuStats({
  totalItems,
  availableItems,
  unavailableItems,
}: MenuStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Plats</p>
              <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <Utensils className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Plats Disponibles</p>
              <p className="text-2xl font-bold text-gray-900">{availableItems}</p>
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
              <p className="text-sm font-medium text-gray-500">Plats Indisponibles</p>
              <p className="text-2xl font-bold text-gray-900">{unavailableItems}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 