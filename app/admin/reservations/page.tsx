'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { LoadingState } from '@/components/ui/loading-state';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { Permission } from '@/types/permissions';
import {
  getReservations,
  updateReservation,
  deleteReservation,
} from '@/actions/admin/reservation-actions';
import {
  StatisticsCards,
  FiltersSection,
  ReservationsTable,
  ReservationDetailsDialog,
} from '@/components/customs/admin/reservations';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { usePusher } from '@/hooks/usePusher';
import { Reservation, ReservationStatus } from '@/types/reservation';

type FilterStatus = ReservationStatus | 'all' | undefined;
type SortOrder = 'date-desc' | 'date-asc' | 'guests-desc' | 'guests-asc';

// Fonction de récupération des données
const fetchReservations = async () => {
  const result = await getReservations();
  if (!result.data) {
    throw new Error("Problème lors de la récupération des réservations");
  }
  return result;
};

export default function ReservationsPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<SortOrder>('date-desc');
  const [deleteReservationId, setDeleteReservationId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Queries
  const { data: reservationsData, isLoading, error } = useQuery({
    queryKey: ['reservations'],
    queryFn: fetchReservations
  });

  // Configuration Pusher pour les réservations
  usePusher({
    channel: 'admin-reservations',
    events: ['new-reservation', 'reservation-updated', 'reservation-deleted'],
    onEvent: (event) => {
      switch (event) {
        case 'new-reservation':
          toast.success('Nouvelle réservation reçue !');
          queryClient.invalidateQueries({ queryKey: ['reservations'] });
          break;
        case 'reservation-updated':
          toast.info('Réservation mise à jour');
          queryClient.invalidateQueries({ queryKey: ['reservations'] });
          break;
        case 'reservation-deleted':
          toast.info('Réservation supprimée');
          queryClient.invalidateQueries({ queryKey: ['reservations'] });
          break;
      }
    },
  });

  // Mutations
  const updateMutation = useMutation({
    mutationFn: updateReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast.success('Réservation mise à jour avec succès');
      setIsOpen(false);
      setEditingReservation(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Une erreur est survenue');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast.success('Réservation supprimée avec succès');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Une erreur est survenue');
    },
  });

  // Handlers
  const handleDelete = async (id: string) => {
    setDeleteReservationId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deleteReservationId) {
      deleteMutation.mutate({ id: deleteReservationId });
      setIsDeleteDialogOpen(false);
      setDeleteReservationId(null);
    }
  };

  const handleStatusChange = (reservation: Reservation, newStatus: ReservationStatus) => {
    updateMutation.mutate({
      id: reservation.id,
      status: newStatus,
      date: reservation.date.toISOString(),
      time: reservation.date instanceof Date ? reservation.date.toTimeString().split(' ')[0] : '',
      email: reservation.user?.email || '',
      phone: reservation.user?.phone || '',
      guests: reservation.table?.seats || 0,
      customerName: reservation.user?.name || '',
      userId: reservation.userId || '',
      tableId: reservation.tableId || '',
    });
  };

  // Filtrage et tri des réservations
  const reservations = (reservationsData?.data?.data?.data || []).map(reservation => ({
    ...reservation,
    date: new Date(reservation.date),
    status: reservation.status as ReservationStatus
  }));

  const filteredReservations = reservations.filter((reservation) => {
    const customerName = reservation.user?.name || '';
    const email = reservation.user?.email || '';
    const phone = reservation.user?.phone || '';
    
    const matchesSearchTerm = 
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      phone.includes(searchTerm);

    const matchesFilterStatus = filterStatus === 'all' || reservation.status === filterStatus;

    const reservationDate = new Date(reservation.date);
    const matchesFilterDate = !filterDate || 
      reservationDate.toISOString().split('T')[0] === filterDate.toISOString().split('T')[0];

    return matchesSearchTerm && matchesFilterStatus && matchesFilterDate;
  }).sort((a, b) => {
    switch (sortOrder) {
      case 'date-desc':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'date-asc':
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case 'guests-desc':
        return (b.table?.seats || 0) - (a.table?.seats || 0);
      case 'guests-asc':
        return (a.table?.seats || 0) - (b.table?.seats || 0);
      default:
        return 0;
    }
  });

  // Statistiques
  const totalReservations = filteredReservations.length;
  const confirmedReservations = filteredReservations.filter((r) => r.status === 'confirmed').length;
  const pendingReservations = filteredReservations.filter((r) => r.status === 'pending').length;
  const totalGuests = filteredReservations.reduce((acc, r) => acc + (r.table?.seats || 0), 0);

  if (isLoading) {
    return <LoadingState message="Chargement des réservations..." fullScreen />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-500 mb-4">Une erreur est survenue lors du chargement des réservations</p>
        <button onClick={() => window.location.reload()}>Réessayer</button>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredPermission={Permission.VIEW_RESERVATIONS}>
      <div className="space-y-4 md:space-y-8">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate">Réservations</h1>
          <p className="text-sm md:text-base text-gray-500 mt-1 md:mt-2">
            Gérez les réservations de votre restaurant
          </p>
        </div>
      </div>

      {/* Statistiques */}
      <StatisticsCards
        totalReservations={totalReservations}
        confirmedReservations={confirmedReservations}
        pendingReservations={pendingReservations}
        totalGuests={totalGuests}
      />

      {/* Filtres */}
      <FiltersSection
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterStatus={filterStatus}
        onStatusChange={(value: FilterStatus) => setFilterStatus(value)}
        filterDate={filterDate}
        onDateChange={setFilterDate}
        sortOrder={sortOrder}
        onSortChange={setSortOrder}
      />

      {/* Liste des réservations */}
      <ReservationsTable
        reservations={filteredReservations}
        onViewReservation={(reservation) => {
          setEditingReservation(reservation);
          setIsOpen(true);
        }}
        onDeleteReservation={handleDelete}
      />

      {/* Modal de détails */}
      <ReservationDetailsDialog
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setEditingReservation(null);
        }}
        reservation={editingReservation}
        onStatusChange={handleStatusChange}
      />

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setDeleteReservationId(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Supprimer la réservation"
        description="Êtes-vous sûr de vouloir supprimer cette réservation ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={deleteMutation.isPending}
        variant="destructive"
      />
      </div>
    </ProtectedRoute>
  );
}