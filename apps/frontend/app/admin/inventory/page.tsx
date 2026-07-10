"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { Plus } from "lucide-react";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import { Permission } from "@/types/permissions";
import { QuickInventoryTable } from "@/components/customs/admin/inventory/quick-inventory-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useIngredients, useInventoryDashboard } from "@/hooks/api/useInventory";
import { useCreateIngredient, useAddStockMovement } from "@/hooks/api/useInventoryMutations";

export default function InventoryV2Page() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Formulaire de création
  const [newProduct, setNewProduct] = useState({
    name: "",
    unit: "unité",
    price: "",
    stock: "0",
    minStock: "",
    supplier: "",
    category: "Boisson",
    packSize: "",
  });

  // Récupération des données via l'API NestJS
  const { data: ingredientsData, isLoading, refetch } = useIngredients();
  const { data: dashboardData } = useInventoryDashboard();

  // Mutations backend
  const createIngredientMutation = useCreateIngredient();
  const addMovementMutation = useAddStockMovement();

  // Handlers
  const handleQuickAdd = useCallback(async (productId: string, quantity: number, isPack: boolean) => {
    await addMovementMutation.mutateAsync({ 
      ingredientId: productId, 
      quantity, 
      type: 'IN',
      description: isPack ? 'Ajout pack' : 'Ajout rapide'
    });
  }, [addMovementMutation]);

  const handleQuickRemove = useCallback(async (productId: string, quantity: number, isPack: boolean) => {
    await addMovementMutation.mutateAsync({ 
      ingredientId: productId, 
      quantity, 
      type: 'OUT',
      description: isPack ? 'Retrait pack' : 'Retrait rapide'
    });
  }, [addMovementMutation]);

  const handleQuickAdjust = useCallback(async (productId: string, newStock: number, description?: string) => {
    // Calculer la différence pour le mouvement ADJUST
    const ingredient = (ingredientsData || []).find((i: any) => i.id === productId);
    if (!ingredient) return;
    
    const diff = newStock - ingredient.stock;
    if (diff === 0) return;
    // Envoyer la diff signée : positif = ajout, négatif = retrait
    await addMovementMutation.mutateAsync({
      ingredientId: productId,
      quantity: diff,
      type: 'ADJUST',
      description: description || 'Ajustement manuel'
    });
  }, [addMovementMutation, ingredientsData]);

  const handleCreateProduct = () => {
    const productData = {
      name: newProduct.name,
      unit: newProduct.unit,
      stock: parseFloat(newProduct.stock),
    };

    createIngredientMutation.mutate(productData, {
      onSuccess: () => {
        toast.success("Produit créé avec succès");
        setIsCreateDialogOpen(false);
        setNewProduct({
          name: "",
          unit: "unité",
          price: "",
          stock: "0",
          minStock: "",
          supplier: "",
          category: "Boisson",
          packSize: "",
        });
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Erreur lors de la création");
      }
    });
  };

  if (isLoading) {
    return <LoadingState message="Chargement de l'inventaire..." />;
  }

  const products = (ingredientsData || []).map((i: any) => ({
    ...i,
    category: i.category || 'Non classé',
  }));

  const stats = {
    total: products.length,
    lowStock: dashboardData?.lowStockCount || 0,
    outOfStock: products.filter((p: any) => p.stock <= 0).length,
    totalValue: products.reduce((acc: number, p: any) => acc + (p.stock * (p.price || 0)), 0),
  };

  return (
    <ProtectedRoute requiredPermission={Permission.VIEW_INVENTORY}>
      <div className="space-y-4 md:space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate">Inventaire & Stock</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Gestion rapide et visuelle de votre stock
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-orange-600 hover:bg-orange-700 w-full sm:w-auto flex-shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Nouveau Produit</span>
          <span className="sm:hidden">Ajouter</span>
        </Button>
      </div>

      {/* Tableau principal */}
      <QuickInventoryTable
        products={products}
        stats={stats}
        onQuickAdd={handleQuickAdd}
        onQuickRemove={handleQuickRemove}
        onQuickAdjust={handleQuickAdjust}
        onRefresh={() => refetch()}
      />

      {/* Dialog Création Produit */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl">Créer un nouveau produit</DialogTitle>
            <DialogDescription className="text-sm">
              Ajouter un nouveau produit à l&apos;inventaire
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du produit *</Label>
              <Input
                id="name"
                placeholder="Ex: Primus 72cl"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Select value={newProduct.category} onValueChange={(v) => setNewProduct({ ...newProduct, category: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Boisson">Boisson</SelectItem>
                  <SelectItem value="Ingrédient">Ingrédient</SelectItem>
                  <SelectItem value="Autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unité *</Label>
              <Select value={newProduct.unit} onValueChange={(v) => setNewProduct({ ...newProduct, unit: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unité">Unité</SelectItem>
                  <SelectItem value="L">Litre (L)</SelectItem>
                  <SelectItem value="kg">Kilogramme (kg)</SelectItem>
                  <SelectItem value="g">Gramme (g)</SelectItem>
                  <SelectItem value="pack">Pack</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Prix unitaire (FCFA) *</Label>
              <Input
                id="price"
                type="number"
                placeholder="500"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                min="0"
                step="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Stock initial</Label>
              <Input
                id="stock"
                type="number"
                placeholder="0"
                value={newProduct.stock}
                onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                min="0"
                step="0.1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minStock">Stock minimum (alerte)</Label>
              <Input
                id="minStock"
                type="number"
                placeholder="10"
                value={newProduct.minStock}
                onChange={(e) => setNewProduct({ ...newProduct, minStock: e.target.value })}
                min="0"
                step="0.1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="packSize">Taille du pack (optionnel)</Label>
              <Input
                id="packSize"
                type="number"
                placeholder="12"
                value={newProduct.packSize}
                onChange={(e) => setNewProduct({ ...newProduct, packSize: e.target.value })}
                min="1"
              />
              <p className="text-xs text-muted-foreground">
                Ex: 12 pour un pack de 12 bouteilles
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">Fournisseur</Label>
              <Input
                id="supplier"
                placeholder="Ex: Bralima"
                value={newProduct.supplier}
                onChange={(e) => setNewProduct({ ...newProduct, supplier: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleCreateProduct} 
              disabled={!newProduct.name || !newProduct.price || createIngredientMutation.isPending}
            >
              {createIngredientMutation.isPending ? "Création..." : "Créer le produit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </ProtectedRoute>
  );
}
