"use client";

import { useLowStockAlerts } from "@/hooks/api/useInventory";
import { AlertTriangle, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export function LowStockAlerts() {
  const { data: alertsData, isLoading } = useLowStockAlerts();
  const alerts = alertsData || [];

  const alertsArray = Array.isArray(alerts) 
  ? alerts 
  : alerts.success 
    ? alerts.data 
    : [];

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

  if (alertsArray.length === 0) {
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
            {alertsArray.length} alerte(s)
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alertsArray.slice(0, 5).map((ingredient: any) => (
            <div
              key={ingredient.id}
              className="flex items-center justify-between p-3 border rounded-lg bg-red-50 border-red-200"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <div>
                  <p className="font-medium text-sm">{ingredient?.name ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">
                    Stock: {ingredient?.stock ?? '?'} {ingredient?.unit ?? ''}
                    {ingredient?.minStock != null && (
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
          
          {alertsArray.length > 5 && (
            <div className="text-center pt-2">
              <p className="text-xs text-muted-foreground">
                +{alertsArray.length - 5} autres ingrédients en stock faible
              </p>
            </div>
          )}
          
          <div className="pt-2">
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/admin/inventory">
                Voir l&apos;inventaire complet
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
