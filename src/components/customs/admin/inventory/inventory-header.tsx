"use client";

import { Plus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InventoryHeaderProps {
  onAddIngredient: () => void;
  onAddStockMovement: () => void;
}

export function InventoryHeader({ onAddIngredient, onAddStockMovement }: InventoryHeaderProps) {
  return (
    <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventaire</h1>
        <p className="text-muted-foreground">
          Gérez vos ingrédients, recettes et mouvements de stock
        </p>
      </div>
      
      <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
        <Button onClick={onAddStockMovement} variant="outline" className="w-full sm:w-auto">
          <TrendingUp className="mr-2 h-4 w-4" />
          Nouveau mouvement
        </Button>
        <Button onClick={onAddIngredient} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nouvel ingrédient
        </Button>
      </div>
    </div>
  );
}
