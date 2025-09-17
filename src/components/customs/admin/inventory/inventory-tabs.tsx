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
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="ingredients" className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          Ingrédients
        </TabsTrigger>
        <TabsTrigger value="recipes" className="flex items-center gap-2">
          <ChefHat className="h-4 w-4" />
          Recettes
        </TabsTrigger>
        <TabsTrigger value="movements" className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Mouvements
        </TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  );
}
