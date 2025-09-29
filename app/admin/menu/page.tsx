"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { MenuTable } from "@/components/customs/admin/menu/menu-table";
import { Pagination } from "@/components/ui/pagination";
import type { MenuItem } from "@/types/menu";

import {
  getAllMenuItems as getMenuItems,
  getCategories,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "@/actions/admin/menu-actions";
import { MenuHeader } from "@/components/customs/admin/menu/menu-header";
import { MenuStats } from "@/components/customs/admin/menu/menu-stats";
import { MenuFilters } from "@/components/customs/admin/menu/menu-filters";
import { MenuForm } from "@/components/customs/admin/menu/menu-form";
import { MenuDetailsDialog } from "@/components/customs/admin/menu/menu-details-dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type MenuItemFormData = {
  name: string;
  description: string;
  price: number;
  categoryId: string;
  image?: string | null;
  isAvailable: boolean;
};

const fetchMenuItems = async (
  search: string,
  categoryId: string | undefined,
  sort: "name" | "price" | "category" | "createdAt",
  order: "asc" | "desc"
) => {
  const result = await getMenuItems({
    search,
    categoryId,
    sortBy: sort === "category" || sort === "createdAt" ? "name" : sort,
    sortOrder: order,
  });

  if (!result.data) {
    throw new Error("Erreur lors de la récupération des plats");
  }
  
  return result.data;
};

const fetchCategories = async () => {
  const result = await getCategories();
  if (!result.data) {
    throw new Error("Erreur lors de la récupération des catégories");
  }
  return result.data;
};

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

  const queryClient = useQueryClient();

  // Récupération des catégories
  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  // Récupération des plats
  const { data: menuData, isLoading } = useQuery({
    queryKey: ["menu-items", search, selectedCategory, sort, order],
    queryFn: () => fetchMenuItems(search, selectedCategory, sort, order),
  });

  // Transform the data to match the expected MenuItem type
  const allItems = (menuData?.data.items || []).map(item => ({
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
    isAvailable: true, // Valeur par défaut si non définie
  })) as MenuItem[];
  const categories = categoriesData?.categories || [];

  // Pagination logic
  const totalItems = allItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const paginatedItems = allItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset page if search/category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory]);

  // Statistiques
  const availableItems = allItems.filter((item: MenuItem) => item.isAvailable).length;
  const unavailableItems = totalItems - availableItems;

  // Mutations
  const createMutation = useMutation({
    mutationFn: createMenuItem,
    onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  })
  const updateMutation = useMutation({
    mutationFn: updateMenuItem,
    onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteMenuItem,
    onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Gestionnaires d'événements
  const handleSubmit = async (values: MenuItemFormData) => {
    const submitData = {
      ...values,
      image: values.image || undefined,
    };

    if (selectedItem) {
      updateMutation.mutate(
        {
          ...submitData,
          id: selectedItem.id,
        },
        {
          onSuccess: () => {
            toast.success("Plat mis à jour avec succès");
            setIsOpen(false);
            setSelectedItem(null);
          },
          onError: (error: Error) => {
            toast.error(error.message);
          },
        }
      );
    } else {
      createMutation.mutate(submitData, {
        onSuccess: () => {
          toast.success("Plat créé avec succès");
          setIsOpen(false);
          setSelectedItem(null);
        },
        onError: (error: Error) => {
          toast.error(error.message);
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
      deleteMutation.mutate(
        { id: deleteItemId },
        {
          onSuccess: () => {
            toast.success("Plat supprimé avec succès");
          },
          onError: (error: Error) => {
            toast.error(error.message);
          },
        }
      );
      setIsDeleteDialogOpen(false);
      setDeleteItemId(null);
    }
  };

  const handleEdit = (item: MenuItem) => {
    setSelectedItem({
      ...item,
      categoryId: item.category.id,
    });
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
    <div className="space-y-8">
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
      
      <MenuTable
        items={paginatedItems}
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
  );
}