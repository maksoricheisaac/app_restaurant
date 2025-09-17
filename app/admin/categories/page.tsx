"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { CategoryHeader } from "@/components/customs/admin/categories/category-header";
import { CategorySearch } from "@/components/customs/admin/categories/category-search";
import { CategoryTable } from "@/components/customs/admin/categories/category-table";
import { CategoryForm } from "@/components/customs/admin/categories/category-form";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "@/actions/admin/category-actions";

const fetchCategories = async (
  search: string,
  page: number,
  perPage: number,
  sortBy: 'name' | 'items',
  sortOrder: 'asc' | 'desc'
) => {
  const result = await getCategories({ search, page, perPage, sortBy, sortOrder });
  if (!result.data) {
    throw new Error("Échec de la récupération des catégories");
  }
  return result.data;
};

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

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["categories", search, page, perPage, sortBy, sortOrder],
    queryFn: () => fetchCategories(search, page, perPage, sortBy, sortOrder),
  });

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      toast.success("Catégorie créée avec succès");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setIsOpen(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Une erreur est survenue");
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateCategory,
    onSuccess: () => {
      toast.success("Catégorie mise à jour avec succès");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setIsOpen(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Une erreur est survenue");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      toast.success("Catégorie supprimée avec succès");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Une erreur est survenue");
    },
  });

  const handleSubmit = async (values: { name: string }) => {
    if (selectedCategory) {
      updateMutation.mutate({
        id: selectedCategory.id,
        name: values.name,
      });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteCategoryId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deleteCategoryId) {
      deleteMutation.mutate({ id: deleteCategoryId });
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
    <div className="space-y-8">
      <CategoryHeader onAdd={handleAdd} />
      
      <CategorySearch 
        search={search} 
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }} 
      />
      
      <CategoryTable
        categories={data?.data.categories || []}
        isLoading={isLoading}
        pagination={{
          total: data?.data.pagination.total || 0,
          totalPages: data?.data.pagination.totalPages || 0,
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
  );
} 