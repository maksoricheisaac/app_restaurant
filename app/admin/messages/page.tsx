"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  getMessageById,
  updateMessage,
  deleteMessage,
} from '@/actions/admin/message-actions';
import { usePusher } from '@/hooks/usePusher';
import type { Message } from '@/types/message';

type MessageStatus = 'new' | 'read' | 'replied' | 'closed';
type FilterStatus = MessageStatus | 'all';
type SortOrder = 'newest' | 'oldest';
type PeriodFilter = 'today' | 'week' | 'month' | 'all';

const fetchMessagesByPeriod = async({ }: { period: PeriodFilter, date?: string }) => {
  // TODO: Implémenter getMessagesByPeriod ou utiliser une autre action
  throw new Error("getMessagesByPeriod n'est pas encore implémenté");
};

const fetchMessageById = async({id}: {id: string}) => {
  const result = await getMessageById({id});
  if(!result.data) throw new Error("Erreur survenue lors de la récupération du message");
  return result.data;
};

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

  const { data: messagesData, isLoading, error } = useQuery({
    queryKey: ['messages', periodFilter, selectedDate],
    queryFn: () => fetchMessagesByPeriod({ period: periodFilter, date: selectedDate || undefined }),
    refetchInterval: 10000,
  });

  const { isLoading: isLoadingDetails } = useQuery({
    queryKey: ['message', editingMessage?.id],
    queryFn: () => fetchMessageById({ id: editingMessage?.id || '' }),
    enabled: !!editingMessage?.id,
    refetchInterval: 10000,
  });

  // Configuration Pusher pour les messages
  usePusher({
    channel: 'admin-messages',
    events: ['new-message', 'message-updated', 'message-deleted'],
    onEvent: (event) => {
      switch (event) {
        case 'new-message':
          toast.success('Nouveau message reçu !');
          queryClient.invalidateQueries({ queryKey: ['messages'] });
          break;
        case 'message-updated':
          toast.info('Message mis à jour');
          queryClient.invalidateQueries({ queryKey: ['messages'] });
          break;
        case 'message-deleted':
          toast.info('Message supprimé');
          queryClient.invalidateQueries({ queryKey: ['messages'] });
          break;
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      toast.success('Message mis à jour avec succès');
      setIsOpen(false);
      setEditingMessage(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Une erreur est survenue');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      toast.success('Message supprimé avec succès');
    },
    onError: (error) => {
      toast.error(error.message || 'Une erreur est survenue');
    },
  });

  const handleViewMessage = (message: Message) => {
    setEditingMessage(message);
    setIsOpen(true);

    if (message.status === 'new') {
      updateMutation.mutate({
        id: message.id,
        customerName: message.customerName,
        email: message.email,
        phone: message.phone || undefined,
        subject: message.subject || undefined,
        message: message.message,
        status: 'read',
        type: message.type || undefined,
        priority: message.priority || undefined,
        source: message.source || undefined,
      });
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteMessageId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deleteMessageId) {
      deleteMutation.mutate({ id: deleteMessageId });
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
      const matchesSearchTerm =
        message.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (message.subject?.toLowerCase() || '').includes(searchTerm.toLowerCase());

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