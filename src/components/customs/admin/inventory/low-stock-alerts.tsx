"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

import { getInventoryDashboard } from "@/actions/admin/inventory-actions";

export function LowStockAlerts() {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["inventory-dashboard"],
    queryFn: async () => {
      const result = await getInventoryDashboard();
      if (!result.data) {
        throw new Error("Erreur lors de la récupération du dashboard");
      }
      return result.data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Alertes de stock
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const lowStockIngredients = dashboardData?.lowStockIngredients || [];

  if (lowStockIngredients.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-green-500" />
            Stock en bon état
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Tous vos ingrédients sont en stock suffisant.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Alertes de stock
          </CardTitle>
          <Badge variant="destructive">
            {lowStockIngredients.length} alerte(s)
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {lowStockIngredients.slice(0, 5).map((ingredient) => (
            <div
              key={ingredient.id}
              className="flex items-center justify-between p-3 border rounded-lg bg-red-50 border-red-200"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <div>
                  <p className="font-medium text-sm">{ingredient.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Stock: {ingredient.stock} {ingredient.unit}
                    {ingredient.minStock && (
                      <span> (min: {ingredient.minStock})</span>
                    )}
                  </p>
                </div>
              </div>
              <Badge variant="destructive" className="text-xs">
                Stock faible
              </Badge>
            </div>
          ))}
          
          {lowStockIngredients.length > 5 && (
            <div className="text-center pt-2">
              <p className="text-xs text-muted-foreground">
                +{lowStockIngredients.length - 5} autres ingrédients en stock faible
              </p>
            </div>
          )}
          
          <div className="pt-2">
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/admin/inventory">
                Voir l'inventaire complet
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
