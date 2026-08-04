"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import { Permission } from "@/types/permissions";

import { MenuTable } from "@/components/customs/admin/menu/menu-table";
import { Pagination } from "@/components/ui/pagination";
import type { MenuItem } from "@/types/menu";

import { useMenuItems, useMenuCategories } from "@/hooks/api/useMenu";
import { useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem } from "@/hooks/api/useMenuMutations";
import { mediaService } from "@/services/media.service";
import { MenuHeader } from "@/components/customs/admin/menu/menu-header";
import { MenuStats } from "@/components/customs/admin/menu/menu-stats";
import { MenuFilters } from "@/components/customs/admin/menu/menu-filters";
import { MenuForm } from "@/components/customs/admin/menu/menu-form";
import { MenuDetailsDialog } from "@/components/customs/admin/menu/menu-details-dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { UtensilsCrossed } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

export default function MenuPage() {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>();
  const [sort, setSort] = useState<"name" | "price" | "category" | "createdAt">("name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedItemForDetails, setSelectedItemForDetails] = useState<MenuItem | null>(null);

  const debouncedSearch = useDebounce(search, 400);

  // Récupération des catégories
  const { data: categories = [] } = useMenuCategories();

  // Récupération des plats via le backend NestJS
  const { data: menuData, isLoading } = useMenuItems({
    search: debouncedSearch,
    categoryId: selectedCategory,
    page: currentPage,
    limit: itemsPerPage,
    sort,
    order
  });

  // Transformation des données pour les composants existants
  const allItems = (menuData?.data || []).map((item: any) => ({
    id: item.id,
    name: item.name,
    description: item.description || "",
    price: item.price,
    category: {
      id: item.category.id,
      name: item.category.name
    },
    categoryId: item.categoryId,
    image: item.image || null,
    available: item.available,
  })) as MenuItem[];

  const totalPages = menuData?.pagination?.pages || 1;
  const totalItems = menuData?.pagination?.total || 0;

  // Statistiques (basées sur les données chargées ou calculées côté back normalement)
  const availableItems = allItems.filter((item: MenuItem) => item.available).length;
  const unavailableItems = allItems.length - availableItems;

  // Mutations backend
  const createMutation = useCreateMenuItem();
  const updateMutation = useUpdateMenuItem();
  const deleteMutation = useDeleteMenuItem();

  // Reset page if search/category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory]);

  // Gestionnaires d'événements
  const handleSubmit = async (rawValues: any, pendingImageFile?: File | null) => {
    // Champ TVA laissé vide = pas de taux propre : l'article suit le taux par
    // défaut de l'établissement. Une chaîne vide ne passerait pas la
    // validation numérique côté serveur.
    const values = {
      ...rawValues,
      taxRate:
        rawValues.taxRate === "" || rawValues.taxRate === undefined
          ? null
          : Number(rawValues.taxRate),
    };

    if (selectedItem) {
      // Image already uploaded immediately in the form (edit mode)
      updateMutation.mutate(
        { id: selectedItem.id, data: values },
        {
          onSuccess: () => {
            toast.success("Plat mis à jour avec succès");
            setIsOpen(false);
            setSelectedItem(null);
          },
          onError: (error: any) => {
            toast.error(error.response?.data?.message || "Erreur lors de la mise à jour");
          },
        }
      );
    } else {
      createMutation.mutate(values, {
        onSuccess: async (data: any) => {
          // Upload pending image now that we have the item ID
          if (pendingImageFile && data?.id) {
            try {
              await mediaService.uploadMenuItemImage(data.id, pendingImageFile);
            } catch {
              toast.warning("Plat créé, mais l'image n'a pas pu être uploadée.");
            }
          }
          toast.success("Plat créé avec succès");
          setIsOpen(false);
          setSelectedItem(null);
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.message || "Erreur lors de la création");
        },
      });
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteItemId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deleteItemId) {
      deleteMutation.mutate(deleteItemId, {
        onSuccess: () => {
          toast.success("Plat supprimé avec succès");
          setIsDeleteDialogOpen(false);
          setDeleteItemId(null);
        },
        onError: (error: any) => {
          toast.error(error.response?.data?.message || "Erreur lors de la suppression");
        },
      });
    }
  };

  const handleEdit = (item: MenuItem) => {
    setSelectedItem(item);
    setIsOpen(true);
  };

  const handleViewDetails = (item: MenuItem) => {
    setSelectedItemForDetails(item);
    setIsDetailsDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedItem(null);
    setIsOpen(true);
  };

  return (
    <ProtectedRoute requiredPermission={Permission.VIEW_MENU}>
      <div className="space-y-4 md:space-y-8">
        <MenuHeader onAdd={handleAdd} />
      
      <MenuStats
        totalItems={totalItems}
        availableItems={availableItems}
        unavailableItems={unavailableItems}
      />
      
      <MenuFilters
        search={search}
        onSearchChange={setSearch}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories}
        sort={sort}
        onSortChange={setSort}
        order={order}
        onOrderChange={() => setOrder(order === "asc" ? "desc" : "asc")}
      />
      {/* Contrôle du nombre d'éléments par page */}
      <div className="flex justify-end items-center">
        <label className="text-sm text-gray-600 mr-2">Éléments par page :</label>
        
        <Select
          value={String(itemsPerPage)}
          onValueChange={(value) => {
            const v = Number(value) || 10;
            setItemsPerPage(v);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Elements par page" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {!isLoading && totalItems === 0 && !search && !selectedCategory ? (
        <EmptyState
          icon={<UtensilsCrossed className="h-8 w-8" />}
          title="Votre menu est vide"
          description="Commencez par ajouter vos premiers plats pour qu'ils apparaissent ici et sur votre menu public."
          action={{ label: "Ajouter un plat", onClick: handleAdd }}
        />
      ) : (
        <>
          <MenuTable
            items={allItems}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdd={handleAdd}
            onViewDetails={handleViewDetails}
          />
          <div className="flex justify-center mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </>
      )}
      
      <MenuForm
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        selectedItem={selectedItem}
        categories={categories}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <MenuDetailsDialog
        isOpen={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        item={selectedItemForDetails}
        onEdit={() => {
          if (selectedItemForDetails) {
            handleEdit(selectedItemForDetails);
            setIsDetailsDialogOpen(false);
          }
        }}
      />

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setDeleteItemId(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Supprimer le plat"
        description="Êtes-vous sûr de vouloir supprimer ce plat ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={deleteMutation.isPending}
        variant="destructive"
      />
      </div>
    </ProtectedRoute>
  );
}