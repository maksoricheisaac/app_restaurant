"use client";

import { useState } from "react";
import { Edit, Trash2, Eye, EyeOff, Search, Filter, ArrowUpDown, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

import type { Ingredient, InventoryFilters } from "@/types/inventory";

interface IngredientTableProps {
  ingredients: Ingredient[];
  isLoading: boolean;
  filters: InventoryFilters;
  onFiltersChange: (filters: InventoryFilters) => void;
  onEdit: (ingredient: Ingredient) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  pagination?: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export function IngredientTable({
  ingredients,
  isLoading,
  filters,
  onFiltersChange,
  onEdit,
  onDelete,
  onToggleStatus,
  pagination,
}: IngredientTableProps) {
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value, page: 1 });
  };

  const handleSortChange = (sortBy: InventoryFilters["sortBy"]) => {
    const newSortOrder = filters.sortBy === sortBy && filters.sortOrder === "asc" ? "desc" : "asc";
    onFiltersChange({ ...filters, sortBy: sortBy ?? "name", sortOrder: newSortOrder, page: 1 });
  };

  const handlePerPageChange = (perPage: number) => {
    onFiltersChange({ ...filters, perPage, page: 1 });
  };

  const handlePageChange = (page: number) => {
    onFiltersChange({ ...filters, page });
  };

  const getStockStatus = (ingredient: Ingredient) => {
    if (!ingredient.isActive) {
      return { label: "Inactif", variant: "secondary" as const };
    }
    if (ingredient.minStock && ingredient.stock <= ingredient.minStock) {
      return { label: "Stock faible", variant: "destructive" as const };
    }
    if (ingredient.stock === 0) {
      return { label: "Rupture", variant: "destructive" as const };
    }
    return { label: "En stock", variant: "default" as const };
  };

  const lowStockIngredients = ingredients.filter(
    (ingredient) => ingredient.isActive && ingredient.minStock && ingredient.stock <= ingredient.minStock
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ingrédients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-10 w-full max-w-sm" />
              <Skeleton className="h-10 w-24" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Alertes de stock faible */}
      {lowStockIngredients.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {lowStockIngredients.length} ingrédient(s) en stock faible nécessitent un réapprovisionnement.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <CardTitle>Ingrédients ({pagination?.total || 0})</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={filters.search || ""}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-8 w-full md:w-64"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="flex flex-wrap items-center gap-4 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">Trier par:</label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => onFiltersChange({ ...filters, sortBy: value as InventoryFilters["sortBy"], page: 1 })}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Nom</SelectItem>
                    <SelectItem value="stock">Stock</SelectItem>
                    <SelectItem value="price">Prix</SelectItem>
                    <SelectItem value="createdAt">Date</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSortChange(filters.sortBy || "name")}
                >
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {ingredients.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">Aucun ingrédient</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Commencez par ajouter un ingrédient à votre inventaire.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Unité</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Prix unitaire</TableHead>
                      <TableHead>Fournisseur</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ingredients.map((ingredient) => {
                      const stockStatus = getStockStatus(ingredient);
                      return (
                        <TableRow key={ingredient.id}>
                          <TableCell className="font-medium">{ingredient.name}</TableCell>
                          <TableCell>{ingredient.unit}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span>{ingredient.stock}</span>
                              {ingredient.minStock && (
                                <span className="text-xs text-muted-foreground">
                                  (min: {ingredient.minStock})
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{ingredient.price.toLocaleString('fr-FR')} FCFA</TableCell>
                          <TableCell>{ingredient.supplier || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={stockStatus.variant}>
                              {stockStatus.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onToggleStatus(ingredient.id)}
                              >
                                {ingredient.isActive ? (
                                  <Eye className="h-4 w-4" />
                                ) : (
                                  <EyeOff className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEdit(ingredient)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDelete(ingredient.id)}
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

              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm text-muted-foreground">Éléments par page:</label>
                    <Select
                      value={String(filters.perPage)}
                      onValueChange={(value) => handlePerPageChange(Number(value))}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
