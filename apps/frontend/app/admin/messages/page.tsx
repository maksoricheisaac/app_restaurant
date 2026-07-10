"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import { Permission } from "@/types/permissions";

import { MessageHeader } from '@/components/customs/admin/messages/message-header';
import { MessageStats } from '@/components/customs/admin/messages/message-stats';
import { MessageFilters } from '@/components/customs/admin/messages/message-filters';
import { MessageTable } from '@/components/customs/admin/messages/message-table';
import { MessageDetails } from '@/components/customs/admin/messages/message-details';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

import { 
  useMessages, 
  useMessage, 
  useUpdateMessage, 
  useDeleteMessage 
} from '@/hooks/api/useMessages';
import { useSocketEvent } from "@/hooks/useSocketEvent";
import type { Message } from '@/types/message';

type MessageStatus = 'new' | 'read' | 'replied' | 'closed';
type FilterStatus = MessageStatus | 'all';
type SortOrder = 'newest' | 'oldest';
type PeriodFilter = 'today' | 'week' | 'month' | 'all';

export default function MessagesPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('today'); // Par défaut, afficher les messages du jour
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [deleteMessageId, setDeleteMessageId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: messagesData, isLoading, error } = useMessages({ 
    period: periodFilter, 
    date: selectedDate || undefined 
  });

  const { isLoading: isLoadingDetails } = useMessage(editingMessage?.id || '');

  // Configuration WebSockets pour les messages
  useSocketEvent('new-message', (_data) => {
    toast.success('Nouveau message reçu !');
    queryClient.invalidateQueries({ queryKey: ['messages'] });
  });

  const updateMutation = useUpdateMessage();
  const deleteMutation = useDeleteMessage();

  const handleViewMessage = (message: Message) => {
    setEditingMessage(message);
    setIsOpen(true);

    if (message.status === 'new') {
      updateMutation.mutate({
        id: message.id,
        data: {
          status: 'read',
        },
      });
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteMessageId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deleteMessageId) {
      deleteMutation.mutate(deleteMessageId, {
        onSuccess: () => toast.success('Message supprimé'),
        onError: (e: any) => toast.error(e?.message || 'Erreur lors de la suppression'),
      });
      setIsDeleteDialogOpen(false);
      setDeleteMessageId(null);
    }
  };

  if (isLoading) {
    return <LoadingState message="Chargement des messages..." fullScreen />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-500 mb-4">Une erreur est survenue lors du chargement des messages</p>
        <Button onClick={() => window.location.reload()}>Réessayer</Button>
      </div>
    );
  }

  const messages = messagesData || [];
  const filteredMessages = messages
    .filter((message: Message) => {
      const q = searchTerm.toLowerCase();
      const matchesSearchTerm =
        (message.customerName ?? '').toLowerCase().includes(q) ||
        (message.email ?? '').toLowerCase().includes(q) ||
        (message.subject ?? '').toLowerCase().includes(q);

      const matchesFilterStatus = filterStatus === 'all' || message.status === filterStatus;

      return matchesSearchTerm && matchesFilterStatus;
    })
    .sort((a: Message, b: Message) => {
      if (sortOrder === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
    });

  const totalMessages = messages.length;
  const newMessages = messages.filter((m: Message) => m.status === 'new').length;

  return (
    <ProtectedRoute requiredPermission={Permission.VIEW_MESSAGES}>
      <div className="space-y-4 md:space-y-8">
      <MessageHeader periodFilter={periodFilter} selectedDate={selectedDate} />
      
      <MessageStats
        totalMessages={totalMessages}
        newMessages={newMessages}
        messages={messages}
        periodFilter={periodFilter}
        selectedDate={selectedDate}
      />
      
      <MessageFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        periodFilter={periodFilter}
        onPeriodFilterChange={setPeriodFilter}
        selectedDate={selectedDate}
        onSelectedDateChange={setSelectedDate}
      />
      
      <MessageTable
        messages={filteredMessages}
        onView={handleViewMessage}
        onDelete={handleDelete}
      />
      
      <MessageDetails
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        message={editingMessage}
        isLoading={isLoadingDetails}
      />

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setDeleteMessageId(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Supprimer le message"
        description="Êtes-vous sûr de vouloir supprimer ce message ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={deleteMutation.isPending}
        variant="destructive"
      />
      </div>
    </ProtectedRoute>
  );
}