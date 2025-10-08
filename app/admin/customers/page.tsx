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
  createCustomer,
  deleteCustomer,
  getCustomers,
  updateCustomer,
} from "@/actions/admin/customer-actions";

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

const fetchCustomers = async (
  search: string,
  status: CustomerStatus | undefined,
  sort: SortField,
  order: "asc" | "desc"
) => {
  const result = await getCustomers({
    search,
    status,
    sort,
    order,
  });

  if (!result.data) {
    throw new Error("Erreur survenue lors de la récupération de la liste des clients");
  }
  
  return result.data;
};

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<CustomerStatus | undefined>();
  const [sort, setSort] = useState<SortField>("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [deleteCustomerId, setDeleteCustomerId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: customersData, isLoading } = useQuery({
    queryKey: ["customers", search, status, sort, order],
    queryFn: () => fetchCustomers(search, status, sort, order),
  });

  const customers = customersData?.data || [];

  // Statistiques des clients
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status === 'active').length;
 

  const createCustomerMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      toast.success("Client créé avec succès");
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: updateCustomer,
    onSuccess: () => {
      toast.success("Client mis à jour avec succès");
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      toast.success("Client supprimé avec succès");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = async (values: CustomerFormData) => {
    if (selectedCustomer) {
      updateCustomerMutation.mutate({
        ...values,
        id: selectedCustomer.id,
      });
    } else {
      createCustomerMutation.mutate(values);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteCustomerId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deleteCustomerId) {
      deleteCustomerMutation.mutate({ id: deleteCustomerId });
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

  return (
    <ProtectedRoute requiredPermission={Permission.VIEW_CUSTOMERS}>
      <div className="space-y-8">
        <CustomerHeader onAdd={handleAdd} />
      
      <CustomerStats
        totalCustomers={totalCustomers}
        activeCustomers={activeCustomers}
      />
      
      <CustomerFilters
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        sort={sort}
        onSortChange={setSort}
        order={order}
        onOrderChange={() => setOrder(order === "asc" ? "desc" : "asc")}
      />
      
      <CustomerTable
        customers={customers}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={handleAdd}
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