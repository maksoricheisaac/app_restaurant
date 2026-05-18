"use client";

import { Package, AlertTriangle, TrendingUp, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { InventoryDashboard } from "@/types/inventory";

interface InventoryStatsProps {
  data?: InventoryDashboard;
  isLoading: boolean;
}

export function InventoryStats({ data, isLoading }: InventoryStatsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: "Total ingrédients",
      value: data?.totalIngredients || 0,
      description: "Ingrédients en stock",
      icon: Package,
      color: "text-blue-600",
    },
    {
      title: "Stock faible",
      value: data?.lowStockCount || 0,
      description: "Ingrédients à réapprovisionner",
      icon: AlertTriangle,
      color: "text-red-600",
    },
    {
      title: "Valeur du stock",
      value: `${(data?.totalStockValue || 0).toLocaleString('fr-FR')} FCFA`,
      description: "Valeur totale de l'inventaire",
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Mouvements récents",
      value: data?.recentMovements?.length || 0,
      description: "Dernières 24h",
      icon: TrendingUp,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
