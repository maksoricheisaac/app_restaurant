"use client";

import { useState, useEffect } from "react";
import { Plus, Minus, Settings2, Search, Package2, AlertTriangle, TrendingUp, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { pusherClient } from "@/lib/pusherClient";

interface Product {
  id: string;
  name: string;
  unit: string;
  price: number;
  stock: number;
  minStock?: number | null;
  supplier?: string | null;
  category?: string | null;
  packSize?: number | null;
  isActive: boolean;
}

interface QuickInventoryTableProps {
  products: Product[];
  stats: {
    total: number;
    lowStock: number;
    outOfStock: number;
    totalValue: number;
  };
  onQuickAdd: (productId: string, quantity: number, isPack: boolean) => Promise<void>;
  onQuickRemove: (productId: string, quantity: number, isPack: boolean) => Promise<void>;
  onQuickAdjust: (productId: string, newStock: number, description?: string) => Promise<void>;
  onRefresh: () => void;
}

export function QuickInventoryTable({
  products,
  stats,
  onQuickAdd,
  onQuickRemove,
  onQuickAdjust,
  onRefresh,
}: QuickInventoryTableProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  
  // Dialog states
  const [adjustDialog, setAdjustDialog] = useState<{ open: boolean; product: Product | null }>({
    open: false,
    product: null,
  });
  const [quickActionDialog, setQuickActionDialog] = useState<{
    open: boolean;
    product: Product | null;
    action: 'add' | 'remove' | null;
  }>({ open: false, product: null, action: null });

  const [adjustValue, setAdjustValue] = useState("");
  const [quickQuantity, setQuickQuantity] = useState("1");
  const [usePack, setUsePack] = useState(false);
  const [loading, setLoading] = useState(false);

  // Écouter les mises à jour en temps réel via Pusher
  useEffect(() => {
    const channel = pusherClient.subscribe('restaurant-channel');
    
    channel.bind('stock-updated', (data: { name: string; newStock: number }) => {
      toast.success(`📦 Stock mis à jour: ${data.name}`, {
        description: `Nouveau stock: ${data.newStock}`,
      });
      onRefresh();
    });

    return () => {
      channel.unbind('stock-updated');
      pusherClient.unsubscribe('restaurant-channel');
    };
  }, [onRefresh]);

  // Filtrer les produits
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) ||
                         product.supplier?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
    const matchesStock = 
      stockFilter === "all" ||
      (stockFilter === "low" && product.minStock && product.stock <= product.minStock) ||
      (stockFilter === "out" && product.stock <= 0);
    
    return matchesSearch && matchesCategory && matchesStock;
  });

  // Obtenir les catégories uniques
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[];

  // Déterminer le statut et la couleur du stock
  const getStockStatus = (product: Product) => {
    if (product.stock <= 0) {
      return { label: "🔴 Rupture", color: "bg-red-100 text-red-800 border-red-300" };
    }
    if (product.minStock && product.stock <= product.minStock) {
      return { label: "🟡 Bas", color: "bg-yellow-100 text-yellow-800 border-yellow-300" };
    }
    return { label: "🟢 OK", color: "bg-green-100 text-green-800 border-green-300" };
  };

  // Formater le prix
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(Math.round(price)) + ' FCFA';
  };

  // Gérer l'ajustement
  const handleAdjust = async () => {
    if (!adjustDialog.product || !adjustValue) return;
    
    setLoading(true);
    try {
      await onQuickAdjust(
        adjustDialog.product.id,
        parseFloat(adjustValue),
        `Ajustement manuel`
      );
      setAdjustDialog({ open: false, product: null });
      setAdjustValue("");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Gérer l'action rapide (+ ou -)
  const handleQuickAction = async () => {
    if (!quickActionDialog.product || !quickActionDialog.action) return;
    
    const quantity = parseFloat(quickQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error("Quantité invalide");
      return;
    }

    setLoading(true);
    try {
      if (quickActionDialog.action === 'add') {
        await onQuickAdd(quickActionDialog.product.id, quantity, usePack);
      } else {
        await onQuickRemove(quickActionDialog.product.id, quantity, usePack);
      }
      setQuickActionDialog({ open: false, product: null, action: null });
      setQuickQuantity("1");
      setUsePack(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produits</CardTitle>
            <Package2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Bas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.lowStock}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rupture</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valeur Stock</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(stats.totalValue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <CardTitle>Inventaire ({filteredProducts.length})</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un produit..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              
              {categories.length > 0 && (
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="low">🟡 Stock bas</SelectItem>
                  <SelectItem value="out">🔴 Rupture</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Prix Unit.</TableHead>
                  <TableHead>Valeur</TableHead>
                  <TableHead className="text-right">Actions Rapides</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucun produit trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => {
                    const status = getStockStatus(product);
                    const stockValue = product.stock * product.price;
                    
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            {product.supplier && (
                              <div className="text-xs text-muted-foreground">{product.supplier}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {product.category && (
                            <Badge variant="outline">{product.category}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold">{product.stock} {product.unit}</span>
                            {product.minStock && (
                              <span className="text-xs text-muted-foreground">Min: {product.minStock}</span>
                            )}
                            {product.packSize && (
                              <span className="text-xs text-blue-600">Pack: {product.packSize} unités</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={status.color} variant="outline">
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatPrice(product.price)}</TableCell>
                        <TableCell className="font-medium">{formatPrice(stockValue)}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => setQuickActionDialog({ open: true, product, action: 'add' })}
                              title="Ajouter au stock"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setQuickActionDialog({ open: true, product, action: 'remove' })}
                              title="Retirer du stock"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => {
                                setAdjustDialog({ open: true, product });
                                setAdjustValue(String(product.stock));
                              }}
                              title="Ajuster le stock"
                            >
                              <Settings2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Ajustement */}
      <Dialog open={adjustDialog.open} onOpenChange={(open) => setAdjustDialog({ open, product: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>⚙ Ajuster le stock</DialogTitle>
            <DialogDescription>
              Définir le stock exact pour <strong>{adjustDialog.product?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Stock actuel: {adjustDialog.product?.stock} {adjustDialog.product?.unit}</Label>
              <Input
                type="number"
                placeholder="Nouveau stock"
                value={adjustValue}
                onChange={(e) => setAdjustValue(e.target.value)}
                min="0"
                step="0.1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialog({ open: false, product: null })}>
              Annuler
            </Button>
            <Button onClick={handleAdjust} disabled={loading}>
              {loading ? "Ajustement..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Action Rapide (+ ou -) */}
      <Dialog 
        open={quickActionDialog.open} 
        onOpenChange={(open) => setQuickActionDialog({ open, product: null, action: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {quickActionDialog.action === 'add' ? '➕ Ajouter au stock' : '➖ Retirer du stock'}
            </DialogTitle>
            <DialogDescription>
              {quickActionDialog.product?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Quantité</Label>
              <Input
                type="number"
                placeholder="Quantité"
                value={quickQuantity}
                onChange={(e) => setQuickQuantity(e.target.value)}
                min="0.1"
                step="0.1"
              />
            </div>
            
            {quickActionDialog.product?.packSize && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="usePack"
                  checked={usePack}
                  onChange={(e) => setUsePack(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="usePack" className="cursor-pointer">
                  En packs ({quickActionDialog.product.packSize} unités/pack)
                </Label>
              </div>
            )}
            
            <div className="text-sm text-muted-foreground">
              Stock actuel: <strong>{quickActionDialog.product?.stock} {quickActionDialog.product?.unit}</strong>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setQuickActionDialog({ open: false, product: null, action: null })}
            >
              Annuler
            </Button>
            <Button onClick={handleQuickAction} disabled={loading}>
              {loading ? "Traitement..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
