"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, TrendingUp, TrendingDown, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";

import { getAllIngredients } from "@/actions/admin/inventory-actions";
import type { StockMovement, StockMovementFilters } from "@/types/inventory";

interface StockMovementTableProps {
  movements: StockMovement[];
  isLoading: boolean;
  filters: StockMovementFilters;
  onFiltersChange: (filters: StockMovementFilters) => void;
  pagination?: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export function StockMovementTable({
  movements,
  isLoading,
  filters,
  onFiltersChange,
  pagination,
}: StockMovementTableProps) {
  const [showFilters, setShowFilters] = useState(false);

  // Récupération des ingrédients pour le filtre
  const { data: ingredientsData } = useQuery({
    queryKey: ["ingredients"],
    queryFn: async () => {
      const result = await getAllIngredients({ page: 1, perPage: 100 });
      if (!result.data) {
        throw new Error("Erreur lors de la récupération des ingrédients");
      }
      return result.data;
    },
  });

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value, page: 1 });
  };

  const handleTypeChange = (type: string) => {
    onFiltersChange({ ...filters, type: type as "IN" | "OUT" | "ADJUST" | undefined, page: 1 });
  };

  const handleIngredientChange = (ingredientId: string) => {
    onFiltersChange({ ...filters, ingredientId: ingredientId === "all" ? undefined : ingredientId, page: 1 });
  };

  const handleDateFromChange = (date: string) => {
    onFiltersChange({ ...filters, dateFrom: date, page: 1 });
  };

  const handleDateToChange = (date: string) => {
    onFiltersChange({ ...filters, dateTo: date, page: 1 });
  };

  const handlePerPageChange = (perPage: number) => {
    onFiltersChange({ ...filters, perPage, page: 1 });
  };

  const handlePageChange = (page: number) => {
    onFiltersChange({ ...filters, page });
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "IN":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "OUT":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case "ADJUST":
        return <RotateCcw className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getMovementBadge = (type: string) => {
    switch (type) {
      case "IN":
        return <Badge variant="default" className="bg-green-100 text-green-800">Entrée</Badge>;
      case "OUT":
        return <Badge variant="destructive">Sortie</Badge>;
      case "ADJUST":
        return <Badge variant="secondary">Ajustement</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const ingredients = ingredientsData?.data?.ingredients || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mouvements de stock</CardTitle>
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
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <CardTitle>Mouvements de stock ({pagination?.total || 0})</CardTitle>
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
              <label className="text-sm font-medium">Type:</label>
              <Select
                value={filters.type || "all"}
                onValueChange={handleTypeChange}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="IN">Entrée</SelectItem>
                  <SelectItem value="OUT">Sortie</SelectItem>
                  <SelectItem value="ADJUST">Ajustement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Ingrédient:</label>
              <Select
                value={filters.ingredientId || "all"}
                onValueChange={handleIngredientChange}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {ingredients.map((ingredient) => (
                    <SelectItem key={ingredient.id} value={ingredient.id}>
                      {ingredient.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Du:</label>
              <Input
                type="date"
                value={filters.dateFrom || ""}
                onChange={(e) => handleDateFromChange(e.target.value)}
                className="w-40"
              />
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Au:</label>
              <Input
                type="date"
                value={filters.dateTo || ""}
                onChange={(e) => handleDateToChange(e.target.value)}
                className="w-40"
              />
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {movements.length === 0 ? (
          <div className="text-center py-8">
            <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">Aucun mouvement</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Aucun mouvement de stock ne correspond à vos critères.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Ingrédient</TableHead>
                    <TableHead>Quantité</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Commande</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>
                        {new Date(movement.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getMovementIcon(movement.type)}
                          {getMovementBadge(movement.type)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {movement.ingredient.name}
                      </TableCell>
                      <TableCell>
                        <span className={movement.type === "OUT" ? "text-red-600" : movement.type === "IN" ? "text-green-600" : ""}>
                          {movement.type === "OUT" ? "-" : movement.type === "IN" ? "+" : ""}
                          {movement.quantity} {movement.ingredient.unit}
                        </span>
                      </TableCell>
                      <TableCell>
                        {movement.description || "-"}
                      </TableCell>
                      <TableCell>
                        {movement.user?.name || "Système"}
                      </TableCell>
                      <TableCell>
                        {movement.order ? (
                          <Badge variant="outline">
                            #{movement.order.id.slice(-8)}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
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
  );
}
