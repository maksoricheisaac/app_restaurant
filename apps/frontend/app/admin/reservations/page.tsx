'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { LoadingState } from '@/components/ui/loading-state';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { Permission } from '@/types/permissions';

import {
  StatisticsCards,
  FiltersSection,
  ReservationsTable,
  ReservationDetailsDialog,
} from '@/components/customs/admin/reservations';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useSocketEvent } from '@/hooks/useSocketEvent';
import { Reservation, ReservationStatus } from '@/types/reservation';
import { useReservations } from '@/hooks/api/useReservations';
import { useUpdateReservationStatus } from '@/hooks/api/useReservationsMutations';

type FilterStatus = ReservationStatus | 'all' | undefined;
type SortOrder = 'date-desc' | 'date-asc' | 'guests-desc' | 'guests-asc';

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
  
  // Récupération des réservations via l'API NestJS
  const { data: reservationsData, isLoading, error } = useReservations({
    status: filterStatus === 'all' ? undefined : filterStatus,
    date: filterDate?.toISOString(),
  });

  // Rafraîchissement en temps réel via WebSockets NestJS
  useSocketEvent('new-reservation', (data) => {
    toast.success('Nouvelle réservation reçue !');
    queryClient.invalidateQueries({ queryKey: ['reservations'] });
  });

  useSocketEvent('reservation-updated', (data) => {
    queryClient.invalidateQueries({ queryKey: ['reservations'] });
  });

  // Mutations backend
  const updateStatusMutation = useUpdateReservationStatus();

  // Handlers
  const handleDelete = async (id: string) => {
    setDeleteReservationId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    // Mutation de suppression à implémenter si nécessaire
    toast.info("Fonctionnalité de suppression à venir");
    setIsDeleteDialogOpen(false);
    setDeleteReservationId(null);
  };

  const handleStatusChange = (reservation: Reservation, newStatus: ReservationStatus) => {
    updateStatusMutation.mutate({
      id: reservation.id,
      status: newStatus,
    }, {
      onSuccess: () => {
        toast.success(`Réservation ${newStatus === 'confirmed' ? 'confirmée' : 'annulée'}`);
        setIsOpen(false);
        setEditingReservation(null);
      }
    });
  };

  const reservations = (reservationsData || []).map((reservation: any) => ({
    ...reservation,
    date: new Date(reservation.date),
    status: reservation.status as ReservationStatus
  })) as Reservation[];

  const filteredReservations = reservations.filter((reservation) => {
    const customerName = reservation.customerName || reservation.user?.name || '';
    const email = reservation.email || reservation.user?.email || '';
    const phone = reservation.phone || reservation.user?.phone || '';
    
    return customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      phone.includes(searchTerm);
  }).sort((a, b) => {
    switch (sortOrder) {
      case 'date-desc':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'date-asc':
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case 'guests-desc':
        return (b.guests || 0) - (a.guests || 0);
      case 'guests-asc':
        return (a.guests || 0) - (b.guests || 0);
      default:
        return 0;
    }
  });

  // Statistiques
  const totalReservations = filteredReservations.length;
  const confirmedReservations = filteredReservations.filter((r) => r.status === 'confirmed').length;
  const pendingReservations = filteredReservations.filter((r) => r.status === 'pending').length;
  const totalGuests = filteredReservations.reduce((acc, r) => acc + (r.guests || 0), 0);

  if (isLoading) {
    return <LoadingState message="Chargement des réservations..." fullScreen />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <p className="text-red-500 mb-4 text-center">Une erreur est survenue lors du chargement des réservations</p>
        <button 
          className="bg-orange-500 text-white px-4 py-2 rounded-lg font-bold"
          onClick={() => window.location.reload()}
        >
          Réessayer
        </button>
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
        isLoading={false}
        variant="destructive"
      />
      </div>
    </ProtectedRoute>
  );
}