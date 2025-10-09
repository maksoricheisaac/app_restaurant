"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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

import {
  getInventoryProducts,
  quickAddStock,
  quickRemoveStock,
  quickAdjustStock,
  createProduct,
} from "@/actions/admin/inventory-quick-actions";

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

  const queryClient = useQueryClient();

  // Récupération des produits
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["inventory-products"],
    queryFn: async () => {
      const result = await getInventoryProducts({
        stockStatus: 'all',
      });
      
      if (!result.data) {
        throw new Error("Erreur lors de la récupération des produits");
      }
      
      return result.data;
    },
  });

  // Mutation pour ajouter du stock
  const addStockMutation = useMutation({
    mutationFn: async ({ productId, quantity, isPack }: { productId: string; quantity: number; isPack: boolean }) => {
      const result = await quickAddStock({ ingredientId: productId, quantity, isPack });
      if (!result.data) throw new Error("Erreur");
      return result;
    },
    onSuccess: (result) => {
      toast.success(result.data?.message || "Stock ajouté");
      queryClient.invalidateQueries({ queryKey: ["inventory-products"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Mutation pour retirer du stock
  const removeStockMutation = useMutation({
    mutationFn: async ({ productId, quantity, isPack }: { productId: string; quantity: number; isPack: boolean }) => {
      const result = await quickRemoveStock({ ingredientId: productId, quantity, isPack });
      if (!result.data) throw new Error("Erreur");
      return result;
    },
    onSuccess: (result) => {
      toast.success(result.data?.message || "Stock retiré");
      queryClient.invalidateQueries({ queryKey: ["inventory-products"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Mutation pour ajuster le stock
  const adjustStockMutation = useMutation({
    mutationFn: async ({ productId, newStock, description }: { productId: string; newStock: number; description?: string }) => {
      const result = await quickAdjustStock({ ingredientId: productId, newStock, description });
      if (!result.data) throw new Error("Erreur");
      return result;
    },
    onSuccess: (result) => {
      toast.success(result.data?.message || "Stock ajusté");
      queryClient.invalidateQueries({ queryKey: ["inventory-products"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Mutation pour créer un produit
  const createProductMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: (result) => {
      toast.success(result.data?.message || "Produit créé");
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
      queryClient.invalidateQueries({ queryKey: ["inventory-products"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Handlers
  const handleQuickAdd = useCallback(async (productId: string, quantity: number, isPack: boolean) => {
    await addStockMutation.mutateAsync({ productId, quantity, isPack });
  }, [addStockMutation]);

  const handleQuickRemove = useCallback(async (productId: string, quantity: number, isPack: boolean) => {
    await removeStockMutation.mutateAsync({ productId, quantity, isPack });
  }, [removeStockMutation]);

  const handleQuickAdjust = useCallback(async (productId: string, newStock: number, description?: string) => {
    await adjustStockMutation.mutateAsync({ productId, newStock, description });
  }, [adjustStockMutation]);

  const handleCreateProduct = () => {
    const productData = {
      name: newProduct.name,
      unit: newProduct.unit,
      price: parseFloat(newProduct.price),
      stock: parseFloat(newProduct.stock),
      minStock: newProduct.minStock ? parseFloat(newProduct.minStock) : undefined,
      supplier: newProduct.supplier || undefined,
      category: newProduct.category || undefined,
      packSize: newProduct.packSize ? parseInt(newProduct.packSize) : undefined,
    };

    createProductMutation.mutate(productData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement de l&apos;inventaire...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventaire & Stock</h1>
          <p className="text-muted-foreground">
            Gestion rapide et visuelle de votre stock
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-orange-600 hover:bg-orange-700">
          <Plus className="mr-2 h-4 w-4" />
          Nouveau Produit
        </Button>
      </div>

      {/* Tableau principal */}
      <QuickInventoryTable
        products={data?.data.products || []}
        stats={data?.data.stats || { total: 0, lowStock: 0, outOfStock: 0, totalValue: 0 }}
        onQuickAdd={handleQuickAdd}
        onQuickRemove={handleQuickRemove}
        onQuickAdjust={handleQuickAdjust}
        onRefresh={() => refetch()}
      />

      {/* Dialog Création Produit */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer un nouveau produit</DialogTitle>
            <DialogDescription>
              Ajouter un nouveau produit à l&apos;inventaire
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
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
                <SelectTrigger>
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
                <SelectTrigger>
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
              disabled={!newProduct.name || !newProduct.price || createProductMutation.isPending}
            >
              {createProductMutation.isPending ? "Création..." : "Créer le produit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
