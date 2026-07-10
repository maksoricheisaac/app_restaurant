"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import { Permission } from "@/types/permissions";

import { CategoryHeader } from "@/components/customs/admin/categories/category-header";
import { CategorySearch } from "@/components/customs/admin/categories/category-search";
import { CategoryTable } from "@/components/customs/admin/categories/category-table";
import { CategoryForm } from "@/components/customs/admin/categories/category-form";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

import { 
  useMenuCategories 
} from "@/hooks/api/useMenu";
import { 
  useCreateMenuCategory, 
  useUpdateMenuCategory, 
  useDeleteMenuCategory 
} from "@/hooks/api/useMenuMutations";

export default function CategoriesPage() {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [sortBy, setSortBy] = useState<'name' | 'items'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedCategory, setSelectedCategory] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: rawData, isLoading } = useMenuCategories({ search, page, perPage, sortBy, sortOrder });

  // Backend returns a flat array; support both flat array and paginated shape
  const allCategories: Array<{ id: string; name: string; _count: { items: number } }> =
    Array.isArray(rawData) ? rawData : (rawData?.categories ?? []);

  const clientFiltered = allCategories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalFiltered = clientFiltered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / perPage));
  const paginatedCategories = clientFiltered.slice((page - 1) * perPage, page * perPage);

  // Keep data shape compatible with the rest of the page
  const data = {
    categories: paginatedCategories,
    pagination: {
      total: totalFiltered,
      totalPages,
      currentPage: page,
    },
  };

  const createMutation = useCreateMenuCategory();
  const updateMutation = useUpdateMenuCategory();
  const deleteMutation = useDeleteMenuCategory();

  const handleSubmit = async (values: { name: string }) => {
    if (selectedCategory) {
      updateMutation.mutate(
        {
          id: selectedCategory.id,
          data: { name: values.name },
        },
        {
          onSuccess: () => {
            toast.success("Catégorie mise à jour avec succès");
            setIsOpen(false);
          },
          onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Une erreur est survenue");
          },
        }
      );
    } else {
      createMutation.mutate(values, {
        onSuccess: () => {
          toast.success("Catégorie créée avec succès");
          setIsOpen(false);
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Une erreur est survenue");
        },
      });
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteCategoryId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deleteCategoryId) {
      deleteMutation.mutate(
        deleteCategoryId,
        {
          onSuccess: () => {
            toast.success("Catégorie supprimée avec succès");
          },
          onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Une erreur est survenue");
          },
        }
      );
      setIsDeleteDialogOpen(false);
      setDeleteCategoryId(null);
    }
  };

  const handleEdit = (category: { id: string; name: string }) => {
    setSelectedCategory(category);
    setIsOpen(true);
  };

  const handleAdd = () => {
    setSelectedCategory(null);
    setIsOpen(true);
  };

  const handleSort = (column: 'name' | 'items') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <ProtectedRoute requiredPermission={Permission.VIEW_MENU}>
      <div className="space-y-4 md:space-y-8">
      <CategoryHeader onAdd={handleAdd} />
      
      <CategorySearch 
        search={search} 
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }} 
      />
      
      <CategoryTable
        categories={data?.categories || []}
        isLoading={isLoading}
        pagination={{
          total: data?.pagination.total || 0,
          totalPages: data?.pagination.totalPages || 0,
          currentPage: page,
        }}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onPageChange={handlePageChange}
      />
      
      <CategoryForm
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        selectedCategory={selectedCategory}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setDeleteCategoryId(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Supprimer la catégorie"
        description="Êtes-vous sûr de vouloir supprimer cette catégorie ? Cette action est irréversible et supprimera également tous les plats associés."
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={deleteMutation.isPending}
        variant="destructive"
      />
      </div>
    </ProtectedRoute>
  );
} 