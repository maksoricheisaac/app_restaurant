import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TopDish {
  name: string;
  orders: number;
}

interface SalesReportProps {
  topDishes: TopDish[];
}

export function SalesReport({ topDishes }: SalesReportProps) {
  // Vérifier que topDishes existe et est un tableau
  const dishes = Array.isArray(topDishes) ? topDishes : [];

  return (
    <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle>Plats les Plus Vendus</CardTitle>
        <CardDescription>Top 3 des spécialités cette période</CardDescription>
      </CardHeader>
      <CardContent>
        {dishes.length > 0 ? (
          <div className="space-y-4">
            {dishes.map((dish, index) => (
              <div key={dish.name} className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="bg-orange-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{dish.name}</p>
                    <p className="text-sm text-gray-600">{dish.orders} commandes</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  #{index + 1}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Aucune donnée de vente disponible pour cette période
          </div>
        )}
      </CardContent>
    </Card>
  );
} 