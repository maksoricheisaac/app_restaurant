"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import { Permission } from "@/types/permissions";

import { CustomerHeader } from "@/components/customs/admin/customers/customer-header";
import { CustomerStats } from "@/components/customs/admin/customers/customer-stats";
import { CustomerFilters } from "@/components/customs/admin/customers/customer-filters";
import { CustomerTable } from "@/components/customs/admin/customers/customer-table";
import { CustomerForm } from "@/components/customs/admin/customers/customer-form";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

import { 
  useCustomers, 
  useCreateCustomer, 
  useUpdateCustomer, 
  useDeleteCustomer 
} from "@/hooks/api/useCustomers";

type CustomerStatus = "active" | "inactive" | "vip";
type SortField = "name" | "email" | "status" | "createdAt";

type CustomerFormData = {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  status: CustomerStatus;
  notes?: string;
};

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  status: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  emailVerified: boolean;
  image: string | null;
  role: string;
  _count: {
    orders: number;
  };
};

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CustomerStatus | undefined>();
  const [sort, setSort] = useState<SortField>("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [deleteCustomerId, setDeleteCustomerId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: customersData, isLoading } = useCustomers({
    search,
    status,
    sort,
    order,
    page,
    limit,
  });

  const customers = customersData?.data || [];
  const pagination = customersData?.pagination;

  // Statistiques des clients
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c: any) => c.status === 'active').length;

  const createCustomerMutation = useCreateCustomer();
  const updateCustomerMutation = useUpdateCustomer();
  const deleteCustomerMutation = useDeleteCustomer();

  const handleSubmit = async (values: CustomerFormData) => {
    if (selectedCustomer) {
      updateCustomerMutation.mutate(
        { id: selectedCustomer.id, data: values },
        {
          onSuccess: () => {
            toast.success('Client mis à jour avec succès');
            setIsOpen(false);
            setSelectedCustomer(null);
          },
          onError: (e: any) => toast.error(e?.message || 'Erreur lors de la mise à jour'),
        }
      );
    } else {
      createCustomerMutation.mutate(values, {
        onSuccess: () => {
          toast.success('Client créé avec succès');
          setIsOpen(false);
        },
        onError: (e: any) => toast.error(e?.message || 'Erreur lors de la création'),
      });
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteCustomerId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deleteCustomerId) {
      deleteCustomerMutation.mutate(deleteCustomerId, {
        onSuccess: () => toast.success('Client supprimé'),
        onError: (e: any) => toast.error(e?.message || 'Erreur lors de la suppression'),
      });
      setIsDeleteDialogOpen(false);
      setDeleteCustomerId(null);
    }
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsOpen(true);
  };

  const handleAdd = () => {
    setSelectedCustomer(null);
    setIsOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Reset to first page when filters change
  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    setPage(1);
  };

  const handleStatusChange = (newStatus: CustomerStatus | undefined) => {
    setStatus(newStatus);
    setPage(1);
  };

  const handleSortChange = (newSort: SortField) => {
    setSort(newSort);
    setPage(1);
  };

  const handleOrderChange = () => {
    setOrder(order === "asc" ? "desc" : "asc");
    setPage(1);
  };

  return (
    <ProtectedRoute requiredPermission={Permission.VIEW_CUSTOMERS}>
      <div className="space-y-4 md:space-y-8">
        <CustomerHeader onAdd={handleAdd} />
      
      <CustomerStats
        totalCustomers={totalCustomers}
        activeCustomers={activeCustomers}
      />
      
      <CustomerFilters
        search={search}
        onSearchChange={handleSearchChange}
        status={status}
        onStatusChange={handleStatusChange}
        sort={sort}
        onSortChange={handleSortChange}
        order={order}
        onOrderChange={handleOrderChange}
      />
      
      <CustomerTable
        customers={customers}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={handleAdd}
        pagination={pagination}
        onPageChange={handlePageChange}
      />
      
      <CustomerForm
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        selectedCustomer={selectedCustomer}
        onSubmit={handleSubmit}
        isLoading={createCustomerMutation.isPending || updateCustomerMutation.isPending}
      />

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setDeleteCustomerId(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Supprimer le client"
        description="Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={deleteCustomerMutation.isPending}
        variant="destructive"
      />
      </div>
    </ProtectedRoute>
  );
}