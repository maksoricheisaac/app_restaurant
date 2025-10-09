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
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6">
      <Card>
        <CardContent className="pt-4 md:pt-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs md:text-sm font-medium text-gray-500 truncate">Total Plats</p>
              <p className="text-lg md:text-2xl font-bold text-gray-900">{totalItems}</p>
            </div>
            <div className="bg-orange-100 p-2 md:p-3 rounded-full flex-shrink-0 ml-2">
              <Utensils className="h-4 w-4 md:h-6 md:w-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 md:pt-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs md:text-sm font-medium text-gray-500 truncate">Disponibles</p>
              <p className="text-lg md:text-2xl font-bold text-gray-900">{availableItems}</p>
            </div>
            <div className="bg-green-100 p-2 md:p-3 rounded-full flex-shrink-0 ml-2">
              <CheckCircle className="h-4 w-4 md:h-6 md:w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 md:pt-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs md:text-sm font-medium text-gray-500 truncate">Indisponibles</p>
              <p className="text-lg md:text-2xl font-bold text-gray-900">{unavailableItems}</p>
            </div>
            <div className="bg-red-100 p-2 md:p-3 rounded-full flex-shrink-0 ml-2">
              <XCircle className="h-4 w-4 md:h-6 md:w-6 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 