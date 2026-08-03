"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink, Store } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRestaurant } from "@/hooks/api/useRestaurant";

/**
 * Lien public de la carte. Il n'y a plus de slug ni de sous-domaine à
 * afficher : la carte vit à `/menu`, une adresse fixe et mémorisable.
 */
export function RestaurantInfoCard() {
  const { data: restaurant, isLoading, isError } = useRestaurant();
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <Card className="border-orange-200 bg-orange-50/40">
        <CardHeader className="pb-3 space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-32" />
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !restaurant) {
    return (
      <Card className="border-slate-200 bg-slate-50/40">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-slate-400" />
            <CardTitle className="text-base text-slate-500">Lien du menu client</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Rechargez la page ou reconnectez-vous pour afficher les informations du restaurant.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const menuUrl =
    typeof window !== "undefined" ? `${window.location.origin}/menu` : "/menu";

  function handleCopy() {
    navigator.clipboard.writeText(menuUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Card className="border-orange-200 bg-orange-50/40">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-orange-500 shrink-0" />
          <CardTitle className="text-base">{restaurant.name}</CardTitle>
        </div>
        {restaurant.slogan && (
          <CardDescription className="text-xs mt-1">
            {restaurant.slogan}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="pt-0 space-y-2">
        <p className="text-xs font-medium text-slate-600">Lien du menu client</p>
        <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2">
          <span className="flex-1 truncate text-sm text-slate-700 font-mono select-all">
            {menuUrl}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-slate-500 hover:text-orange-600"
            onClick={handleCopy}
            title="Copier le lien"
          >
            {copied
              ? <Check className="h-4 w-4 text-green-500" />
              : <Copy className="h-4 w-4" />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-slate-500 hover:text-orange-600"
            asChild
          >
            <a href={menuUrl} target="_blank" rel="noopener noreferrer" title="Ouvrir le menu">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
        <p className="text-xs text-slate-400">
          Partagez ce lien avec vos clients ou générez un QR code depuis la page{" "}
          <a href="/admin/tables" className="underline hover:text-orange-500">Tables</a>.
        </p>
      </CardContent>
    </Card>
  );
}
