"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, ChefHat, TrendingUp } from "lucide-react";

interface InventoryTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  children: React.ReactNode;
}

export function InventoryTabs({ activeTab, onTabChange, children }: InventoryTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-6">
      <TabsList className="grid w-full grid-cols-3 gap-1">
        <TabsTrigger value="ingredients" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
          <Package className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden xs:inline">Ingrédients</span>
          <span className="xs:hidden">Ingr.</span>
        </TabsTrigger>
        <TabsTrigger value="recipes" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
          <ChefHat className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden xs:inline">Recettes</span>
          <span className="xs:hidden">Rec.</span>
        </TabsTrigger>
        <TabsTrigger value="movements" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
          <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden xs:inline">Mouvements</span>
          <span className="xs:hidden">Mouv.</span>
        </TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  );
}
