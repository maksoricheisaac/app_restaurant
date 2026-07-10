'use client';

import { useState } from "react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import { Permission } from "@/types/permissions";
import { 
  useTables, 
  useTableLocations, 
  useCreateTable, 
  useUpdateTable, 
  useDeleteTable 
} from "@/hooks/api/useTables";
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

export default function TablesPage() {
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
  const { data: tablesResponse, isLoading } = useTables({ 
    search, 
    isAvailable, 
    location, 
    sort, 
    order 
  });

  const { data: availableLocations } = useTableLocations();

  // Mutations
  const createMutation = useCreateTable();
  const updateMutation = useUpdateTable();
  const deleteMutation = useDeleteTable();

  // Handlers
  const handleSubmit = async (values: FormValues) => {
    try {
      if (selectedTable) {
        await updateMutation.mutateAsync({ id: selectedTable.id, ...values });
        toast.success('Table mise à jour avec succès');
      } else {
        await createMutation.mutateAsync(values);
        toast.success('Table créée avec succès');
      }
      setIsOpen(false);
      setSelectedTable(null);
    } catch (error: any) {
      toast.error(error?.message || 'Une erreur est survenue');
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteTableId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deleteTableId) {
      deleteMutation.mutate(deleteTableId, {
        onSuccess: () => toast.success('Table supprimée'),
        onError: (e: any) => toast.error(e?.message || 'Erreur lors de la suppression'),
      });
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

  // Backend returns a flat array; guard against both shapes
  const tables: TableData[] = Array.isArray(tablesResponse)
    ? tablesResponse
    : (tablesResponse?.data ?? []);
  const totalTables = tables.length;
  const availableTables = tables.filter((t: TableData) => t.status === "available").length;
  const occupiedTables = totalTables - availableTables;
  const totalCapacity = tables.reduce((acc: number, t: TableData) => acc + t.seats, 0);

  return (
    <ProtectedRoute requiredPermission={Permission.VIEW_TABLES}>
      <div className="space-y-4 md:space-y-8">
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
        availableLocations={Array.isArray(availableLocations) ? availableLocations : []}
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
        onClose={() => { setIsOpen(false); setSelectedTable(null); }}
        onSubmit={handleSubmit}
        selectedTable={selectedTable}
        isLoading={createMutation.isPending || updateMutation.isPending}
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