'use client';

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import { Permission } from "@/types/permissions";
import {
  createTable,
  deleteTable,
  getTables,
  updateTable,
  getTableLocations,
} from "@/actions/admin/table-actions";
import {
  PageHeader,
  StatisticsCards,
  FiltersSection,
  TablesList,
  TableFormDialog,
  QRCodeDialog,
  TableData,
  FormValues,
  SortField,
} from "@/components/customs/admin/tables";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

const fetchTables = async ({
  search,
  isAvailable,
  minCapacity,
  maxCapacity,
  location,
  sort,
  order,
}: {
  search?: string;
  isAvailable?: boolean;
  minCapacity?: number;
  maxCapacity?: number;
  location?: string;
  sort?: "number" | "seats" | "location";
  order?: "asc" | "desc";
}) => {
  const result = await getTables({
    search,
    isAvailable,
    minCapacity,
    maxCapacity,
    location,
    sort,
    order,
  });

  if(!result.data) {
    throw new Error("Problème lors de la récupération des tables")
  }

  return result.data
}

const fetchTableLocations = async () => {
  const result = await getTableLocations();
  
  if(!result.data) {
    throw new Error("Problème lors de la récupération des localisations")
  }

  return result.data
}

export default function TablesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isAvailable, setIsAvailable] = useState<boolean | undefined>();
  const [location, setLocation] = useState<string>();
  const [sort, setSort] = useState<SortField>("number");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [deleteTableId, setDeleteTableId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isQRDialogOpen, setIsQRDialogOpen] = useState(false);
  const [qrTable, setQrTable] = useState<TableData | null>(null);

  // Queries
  const { data: tablesResponse, isLoading } = useQuery({
    queryKey: ["tables", search, isAvailable, location, sort, order],
    queryFn: () => fetchTables({ search, isAvailable, location, sort, order }),
  });

  const { data: availableLocations } = useQuery({
    queryKey: ["table-locations"],
    queryFn: fetchTableLocations,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createTable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["table-locations"] });
      toast.success("Table créée avec succès");
      setIsOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Une erreur est survenue");
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateTable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["table-locations"] });
      toast.success("Table mise à jour avec succès");
      setIsOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Une erreur est survenue");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["table-locations"] });
      toast.success("Table supprimée avec succès");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Une erreur est survenue");
    },
  });

  // Handlers
  const handleSubmit = async (values: FormValues) => {
    try {
      if (selectedTable) {
        await updateMutation.mutateAsync({
          id: selectedTable.id,
          ...values,
        });
      } else {
        await createMutation.mutateAsync(values);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteTableId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deleteTableId) {
      deleteMutation.mutate({ id: deleteTableId });
      setIsDeleteDialogOpen(false);
      setDeleteTableId(null);
    }
  };

  const handleEdit = (table: TableData) => {
    setSelectedTable(table);
    setIsOpen(true);
  };

  const handleAdd = () => {
    setSelectedTable(null);
    setIsOpen(true);
  };

  const handleQRCode = (table: TableData) => {
    setQrTable(table);
    setIsQRDialogOpen(true);
  };

  const handleQRDialogClose = () => {
    setIsQRDialogOpen(false);
    setQrTable(null);
  };

  // Data processing
  const tables = tablesResponse?.data || [];
  const totalTables = tables.length;
  const availableTables = tables.filter(table => table.status === "available").length;
  const occupiedTables = totalTables - availableTables;
  const totalCapacity = tables.reduce((acc, table) => acc + table.seats, 0);

  return (
    <ProtectedRoute requiredPermission={Permission.VIEW_TABLES}>
      <div className="space-y-8">
      <PageHeader onAddClick={handleAdd} />

      <StatisticsCards
        totalTables={totalTables}
        availableTables={availableTables}
        occupiedTables={occupiedTables}
        totalCapacity={totalCapacity}
      />

      <FiltersSection
        search={search}
        onSearchChange={setSearch}
        isAvailable={isAvailable}
        onAvailabilityChange={setIsAvailable}
        location={location}
        onLocationChange={setLocation}
        sortField={sort}
        onSortFieldChange={setSort}
        sortOrder={order}
        onSortOrderChange={setOrder}
        availableLocations={availableLocations?.data || []}
      />

      <TablesList
        tables={tables}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={handleAdd}
        onQRCode={handleQRCode}
      />

      <TableFormDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
        selectedTable={selectedTable}
      />

      <QRCodeDialog
        isOpen={isQRDialogOpen}
        onClose={handleQRDialogClose}
        table={qrTable}
      />

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setDeleteTableId(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Supprimer la table"
        description="Êtes-vous sûr de vouloir supprimer cette table ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={deleteMutation.isPending}
        variant="destructive"
      />
      </div>
    </ProtectedRoute>
  );
}