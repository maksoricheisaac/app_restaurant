"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { InventoryHeader } from "@/components/customs/admin/inventory/inventory-header";
import { InventoryStats } from "@/components/customs/admin/inventory/inventory-stats";
import { IngredientTable } from "@/components/customs/admin/inventory/ingredient-table";
import { RecipeTable } from "@/components/customs/admin/inventory/recipe-table";
import { StockMovementTable } from "@/components/customs/admin/inventory/stock-movement-table";
import { IngredientForm } from "@/components/customs/admin/inventory/ingredient-form";
import { RecipeForm } from "@/components/customs/admin/inventory/recipe-form";
import { StockMovementForm } from "@/components/customs/admin/inventory/stock-movement-form";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  getAllIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  toggleIngredientStatus,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getStockMovements,
  createStockMovement,
  getInventoryDashboard,
} from "@/actions/admin/inventory-actions";

import type { 
  Ingredient, 
  Recipe, 
  IngredientFormData, 
  RecipeFormData, 
  StockMovementFormData,
  InventoryFilters,
  StockMovementFilters
} from "@/types/inventory";

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState("ingredients");
  const [isIngredientFormOpen, setIsIngredientFormOpen] = useState(false);
  const [isRecipeFormOpen, setIsRecipeFormOpen] = useState(false);
  const [isStockMovementFormOpen, setIsStockMovementFormOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<"ingredient" | "recipe" | "movement">("ingredient");

  // Filtres pour les ingrédients
  const [ingredientFilters, setIngredientFilters] = useState<InventoryFilters>({
    search: "",
    page: 1,
    perPage: 10,
    sortBy: "name",
    sortOrder: "asc",
  });

  // Filtres pour les mouvements de stock
  const [movementFilters, setMovementFilters] = useState<StockMovementFilters>({
    search: "",
    page: 1,
    perPage: 10,
  });

  const queryClient = useQueryClient();

  // Récupération du dashboard
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ["inventory-dashboard"],
    queryFn: async () => {
      const result = await getInventoryDashboard();
      if (!result.data) {
        throw new Error("Erreur lors de la récupération du dashboard");
      }
      return result.data;
    },
  });

  // Récupération des ingrédients
  const { data: ingredientsData, isLoading: isIngredientsLoading } = useQuery({
    queryKey: ["ingredients", ingredientFilters],
    queryFn: async () => {
      const result = await getAllIngredients(ingredientFilters);
      if (!result.data) {
        throw new Error("Erreur lors de la récupération des ingrédients");
      }
      return result.data;
    },
  });

  // Récupération des mouvements de stock
  const { data: movementsData, isLoading: isMovementsLoading } = useQuery({
    queryKey: ["stock-movements", movementFilters],
    queryFn: async () => {
      const result = await getStockMovements(movementFilters);
      if (!result.data) {
        throw new Error("Erreur lors de la récupération des mouvements");
      }
      return result.data;
    },
  });

  // Mutations pour les ingrédients
  const createIngredientMutation = useMutation({
    mutationFn: createIngredient,
    onSuccess: () => {
      toast.success("Ingrédient créé avec succès");
      setIsIngredientFormOpen(false);
      setSelectedIngredient(null);
      queryClient.invalidateQueries({ queryKey: ["ingredients", "inventory-dashboard"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateIngredientMutation = useMutation({
    mutationFn: updateIngredient,
    onSuccess: () => {
      toast.success("Ingrédient mis à jour avec succès");
      setIsIngredientFormOpen(false);
      setSelectedIngredient(null);
      queryClient.invalidateQueries({ queryKey: ["ingredients", "inventory-dashboard"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteIngredientMutation = useMutation({
    mutationFn: deleteIngredient,
    onSuccess: () => {
      toast.success("Ingrédient supprimé avec succès");
      queryClient.invalidateQueries({ queryKey: ["ingredients", "inventory-dashboard"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const toggleIngredientStatusMutation = useMutation({
    mutationFn: toggleIngredientStatus,
    onSuccess: () => {
      toast.success("Statut de l'ingrédient mis à jour");
      queryClient.invalidateQueries({ queryKey: ["ingredients", "inventory-dashboard"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Mutations pour les recettes
  const createRecipeMutation = useMutation({
    mutationFn: createRecipe,
    onSuccess: () => {
      toast.success("Recette créée avec succès");
      setIsRecipeFormOpen(false);
      setSelectedRecipe(null);
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateRecipeMutation = useMutation({
    mutationFn: updateRecipe,
    onSuccess: () => {
      toast.success("Recette mise à jour avec succès");
      setIsRecipeFormOpen(false);
      setSelectedRecipe(null);
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteRecipeMutation = useMutation({
    mutationFn: deleteRecipe,
    onSuccess: () => {
      toast.success("Recette supprimée avec succès");
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Mutation pour les mouvements de stock
  const createStockMovementMutation = useMutation({
    mutationFn: createStockMovement,
    onSuccess: () => {
      toast.success("Mouvement de stock créé avec succès");
      setIsStockMovementFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ["stock-movements", "ingredients", "inventory-dashboard"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Gestionnaires d'événements
  const handleIngredientSubmit = async (values: IngredientFormData) => {
    // Normaliser les champs nullable en undefined pour correspondre aux schémas des actions
    const normalizedValues = {
      ...values,
      minStock: values.minStock ?? undefined,
      supplier: values.supplier ?? undefined,
    };

    if (selectedIngredient) {
      updateIngredientMutation.mutate({
        ...normalizedValues,
        id: selectedIngredient.id,
      });
    } else {
      createIngredientMutation.mutate(normalizedValues);
    }
  };

  const handleRecipeSubmit = async (values: RecipeFormData) => {
    if (selectedRecipe) {
      updateRecipeMutation.mutate({
        ...values,
        id: selectedRecipe.id,
      });
    } else {
      createRecipeMutation.mutate(values);
    }
  };

  const handleStockMovementSubmit = async (values: StockMovementFormData) => {
    createStockMovementMutation.mutate(values);
  };

  const handleDelete = async (id: string, type: "ingredient" | "recipe" | "movement") => {
    setDeleteItemId(id);
    setDeleteType(type);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deleteItemId) {
      if (deleteType === "ingredient") {
        deleteIngredientMutation.mutate({ id: deleteItemId });
      } else if (deleteType === "recipe") {
        deleteRecipeMutation.mutate({ id: deleteItemId });
      }
      setIsDeleteDialogOpen(false);
      setDeleteItemId(null);
    }
  };

  const handleEditIngredient = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setIsIngredientFormOpen(true);
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsRecipeFormOpen(true);
  };

  const handleAddIngredient = () => {
    setSelectedIngredient(null);
    setIsIngredientFormOpen(true);
  };

  const handleAddRecipe = () => {
    setSelectedRecipe(null);
    setIsRecipeFormOpen(true);
  };

  const handleAddStockMovement = () => {
    setIsStockMovementFormOpen(true);
  };

  const handleToggleIngredientStatus = (id: string) => {
    toggleIngredientStatusMutation.mutate({ id });
  };

  return (
    <div className="space-y-8">
      <InventoryHeader onAddIngredient={handleAddIngredient} onAddStockMovement={handleAddStockMovement} />
      
      <InventoryStats 
        data={dashboardData?.data}
        isLoading={isDashboardLoading}
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ingredients">Ingrédients</TabsTrigger>
          <TabsTrigger value="recipes">Recettes</TabsTrigger>
          <TabsTrigger value="movements">Mouvements</TabsTrigger>
        </TabsList>

        <TabsContent value="ingredients" className="space-y-6">
          <IngredientTable
            ingredients={ingredientsData?.data?.ingredients || []}
            isLoading={isIngredientsLoading}
            filters={ingredientFilters}
            onFiltersChange={setIngredientFilters}
            onEdit={handleEditIngredient}
            onDelete={(id) => handleDelete(id, "ingredient")}
            onToggleStatus={handleToggleIngredientStatus}
            pagination={ingredientsData?.data?.pagination}
          />
        </TabsContent>

        <TabsContent value="recipes" className="space-y-6">
          <RecipeTable
            onAdd={handleAddRecipe}
            onEdit={handleEditRecipe}
            onDelete={(id) => handleDelete(id, "recipe")}
          />
        </TabsContent>

        <TabsContent value="movements" className="space-y-6">
          <StockMovementTable
            movements={movementsData?.data?.movements || []}
            isLoading={isMovementsLoading}
            filters={movementFilters}
            onFiltersChange={setMovementFilters}
            pagination={movementsData?.data?.pagination}
          />
        </TabsContent>
      </Tabs>

      {/* Formulaires */}
      <IngredientForm
        isOpen={isIngredientFormOpen}
        onOpenChange={setIsIngredientFormOpen}
        selectedIngredient={selectedIngredient}
        onSubmit={handleIngredientSubmit}
        isLoading={createIngredientMutation.isPending || updateIngredientMutation.isPending}
      />

      <RecipeForm
        isOpen={isRecipeFormOpen}
        onOpenChange={setIsRecipeFormOpen}
        selectedRecipe={selectedRecipe}
        onSubmit={handleRecipeSubmit}
        isLoading={createRecipeMutation.isPending || updateRecipeMutation.isPending}
      />

      <StockMovementForm
        isOpen={isStockMovementFormOpen}
        onOpenChange={setIsStockMovementFormOpen}
        onSubmit={handleStockMovementSubmit}
        isLoading={createStockMovementMutation.isPending}
      />

      {/* Dialog de confirmation de suppression */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setDeleteItemId(null);
        }}
        onConfirm={handleDeleteConfirm}
        title={`Supprimer ${deleteType === "ingredient" ? "l'ingrédient" : deleteType === "recipe" ? "la recette" : "le mouvement"}`}
        description={`Êtes-vous sûr de vouloir supprimer ${deleteType === "ingredient" ? "cet ingrédient" : deleteType === "recipe" ? "cette recette" : "ce mouvement"} ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={deleteIngredientMutation.isPending || deleteRecipeMutation.isPending}
        variant="destructive"
      />
    </div>
  );
}
