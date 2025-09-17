"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Edit, Trash2, ChefHat, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { getRecipesByMenuItem } from "@/actions/admin/inventory-actions";
import { getAllMenuItems } from "@/actions/admin/menu-actions";
import type { Recipe } from "@/types/inventory";

interface RecipeTableProps {
  onAdd: () => void;
  onEdit: (recipe: Recipe) => void;
  onDelete: (id: string) => void;
}

export function RecipeTable({ onAdd, onEdit, onDelete }: RecipeTableProps) {
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string>("");
  const [search, setSearch] = useState("");

  // Récupération des éléments du menu
  const { data: menuData } = useQuery({
    queryKey: ["menu-items"],
    queryFn: async () => {
      const result = await getAllMenuItems({ page: 1, perPage: 100 });
      if (!result.data) {
        throw new Error("Erreur lors de la récupération du menu");
      }
      return result.data;
    },
  });

  // Récupération des recettes pour l'élément sélectionné
  const { data: recipesData, isLoading } = useQuery({
    queryKey: ["recipes", selectedMenuItemId],
    queryFn: async () => {
      if (!selectedMenuItemId) return { recipes: [] };
      const result = await getRecipesByMenuItem({ menuItemId: selectedMenuItemId });
      if (!result.data) {
        throw new Error("Erreur lors de la récupération des recettes");
      }
      return { recipes: result.data };
    },
    enabled: !!selectedMenuItemId,
  });

  const menuItems = menuData?.data?.items || [];
  const recipes = recipesData?.recipes || [];

  const recipesArray = Array.isArray(recipes) 
  ? recipes 
  : recipes.success 
    ? recipes.data 
    : [];

const filteredRecipes = recipesArray.filter((recipe) =>
  recipe.ingredient.name.toLowerCase().includes(search.toLowerCase())
);


  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <CardTitle>Recettes</CardTitle>
            <Button onClick={onAdd} className="w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle recette
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Sélectionner un plat</label>
              <Select value={selectedMenuItemId} onValueChange={setSelectedMenuItemId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un plat du menu" />
                </SelectTrigger>
                <SelectContent>
                  {menuItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} - {item.category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedMenuItemId && (
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Rechercher un ingrédient</label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un ingrédient..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            )}
          </div>

          {!selectedMenuItemId ? (
            <div className="text-center py-8">
              <ChefHat className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">Sélectionnez un plat</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Choisissez un plat du menu pour voir ses recettes.
              </p>
            </div>
          ) : isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredRecipes.length === 0 ? (
            <div className="text-center py-8">
              <ChefHat className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">
                {search ? "Aucun ingrédient trouvé" : "Aucune recette"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {search
                  ? "Aucun ingrédient ne correspond à votre recherche."
                  : "Ce plat n'a pas encore de recette définie."}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingrédient</TableHead>
                    <TableHead>Quantité</TableHead>
                    <TableHead>Unité</TableHead>
                    <TableHead>Prix unitaire</TableHead>
                    <TableHead>Coût total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecipes.map((recipe) => {
                    const totalCost = recipe.quantity * recipe.ingredient.price;
                    return (
                      <TableRow key={recipe.id}>
                        <TableCell className="font-medium">
                          {recipe.ingredient.name}
                        </TableCell>
                        <TableCell>{recipe.quantity}</TableCell>
                        <TableCell>{recipe.ingredient.unit}</TableCell>
                        <TableCell>
                          {recipe.ingredient.price.toLocaleString('fr-FR')} FCFA
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {totalCost.toLocaleString('fr-FR')} FCFA
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(recipe)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDelete(recipe.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
