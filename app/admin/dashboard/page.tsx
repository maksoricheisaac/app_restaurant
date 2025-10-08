"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getDashboardStats, getLatestOrders } from "@/actions/admin/dashboard-actions";
import { updateOrderStatus } from '@/actions/admin/order-actions';
import { Order, OrderStatus } from '@/types/order';
import { useMutation } from '@tanstack/react-query';
import { pusherClient } from "@/lib/pusherClient";
import { OrderTicketPreview } from "@/components/customs/admin/orders/order-ticket-preview";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  DashboardHeader,
  DashboardDateSelector,
  DashboardStatsCards,
  DashboardOrdersSection
} from "@/components/admin/dashboard";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import { Permission } from "@/types/permissions";

const fetchStats = async({date}: {date: string}) => {
  const result = await getDashboardStats({ date });
  if ('data' in result && result.data) {
    return result.data;
  }
  return undefined;
}

const fetchLatestOrders = async({page, perPage, status}: {page: number, perPage: number, status: OrderStatus | undefined}) => {
  const result = await getLatestOrders({ page, perPage, status });
  if ('data' in result && result.data) {
    return result.data;
  }
  return undefined;
}

// Fonction de formatage de la monnaie (copiée depuis OrdersPage)
const formatCurrency = (amount: number) => {
  const formatted = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  
  
  return formatted.replace(/\//g, ' ');
}

const statusColors = {
  pending: "bg-yellow-500",
  preparing: "bg-blue-500",
  ready: "bg-indigo-500",
  served: "bg-orange-500",
  completed: "bg-emerald-600",
  paid: "bg-green-500",
  cancelled: "bg-red-500",
} as const;

const typeLabels = {
  dine_in: "Sur place",
  takeaway: "À emporter",
  delivery: "Livraison",
} as const;

const statusLabels = {
  pending: "En attente",
  preparing: "En préparation",
  ready: "Prête",
  served: "Servie",
  completed: "Terminée",
  paid: "Payée",
  cancelled: "Annulée",
} as const;

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [orderStatus, setOrderStatus] = useState<OrderStatus | undefined>();
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [ticketPreviewOrder, setTicketPreviewOrder] = useState<Order | null>(null);
  const [isTicketPreviewOpen, setIsTicketPreviewOpen] = useState(false);

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const result = await updateOrderStatus({ orderId: id, status });
      if ('data' in result && result.data) {
        return result.data;
      }
      throw new Error('Erreur lors de la mise à jour du statut de la commande');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['latest-orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour du statut de la commande");
    },
  });

  useEffect(() => {
    if (typeof window !== "undefined" && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  // Query pour les statistiques
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['dashboard-stats', selectedDate],
    queryFn: () => fetchStats({date: selectedDate}),
  });

  const { data: ordersData, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['latest-orders', page, perPage, orderStatus],
    queryFn: () => fetchLatestOrders({ page, perPage, status: orderStatus }),
  });

  // ⏱️ Synchronisation temps réel avec Pusher
  useEffect(() => {
    try {
      const channel = pusherClient.subscribe("restaurant-channel");
    
      const audio = new Audio("/notification.mp3");
    
      const notify = (title: string, body: string) => {
        
        // Lancer son
        audio.play().catch(() => {});
    
        // Lancer notification système
        if (Notification.permission === "granted") {
          new Notification(title, { body });
        }
      };
    
      // Notification nouvelle commande
      channel.bind("new-order", (data: unknown) => {
        const orderData = data as { order?: { customer?: { name?: string } } };
        const customerName = orderData?.order?.customer?.name || "Client inconnu";
        notify("Nouvelle commande", `Commande de ${customerName}`);
        
        queryClient.invalidateQueries({ queryKey: ["latest-orders"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      });
    
      // Notification mise à jour de statut
      channel.bind("order-status-updated", (data: unknown) => {
        
        const statusData = data as { orderId?: string; status?: string };
        notify("Commande mise à jour", `Commande #${statusData.orderId} => ${statusData.status}`);
        
        queryClient.invalidateQueries({ queryKey: ["latest-orders"] });
      });
    
      return () => {

        channel.unbind_all();
        channel.unsubscribe();
      };
    } catch {
      toast.error("Erreur lors de la connexion Pusher");
    }
  }, [page, perPage, orderStatus, queryClient]);

  const handlePrintPDF = (order: Order) => {
    setTicketPreviewOrder(order);
    setIsTicketPreviewOpen(true);
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateOrderMutation.mutate({ id: orderId, status: newStatus });
  };

  const handleCancel = (orderId: string) => {
    updateOrderMutation.mutate({ id: orderId, status: "cancelled" });
  };

  // Fonction pour obtenir la couleur du badge selon le statut
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'preparing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <ProtectedRoute requiredPermission={Permission.VIEW_DASHBOARD}>
      <div className="space-y-8">
        <DashboardHeader />
      
      <DashboardDateSelector
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

      <DashboardStatsCards
        statsData={statsData?.data}
        isLoading={isLoadingStats}
      />

      <DashboardOrdersSection
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        orderStatus={orderStatus}
        onStatusChange={setOrderStatus}
        orders={ordersData?.data?.orders || []}
        isLoading={isLoadingOrders}
        page={page}
        totalPages={ordersData?.data?.pagination?.totalPages || 1}
        onPageChange={setPage}
        onStatusChangeOrder={handleStatusChange}
        onCancel={handleCancel}
        onPrintPDF={handlePrintPDF}
        formatCurrency={formatCurrency}
        statusColors={statusColors}
        statusLabels={statusLabels}
        typeLabels={typeLabels}
        isUpdating={updateOrderMutation.isPending}
        getStatusBadgeColor={getStatusBadgeColor}
      />

      {/* Prévisualisation du ticket */}
      <OrderTicketPreview
        order={ticketPreviewOrder}
        isOpen={isTicketPreviewOpen}
        onClose={() => {
          setIsTicketPreviewOpen(false);
          setTicketPreviewOrder(null);
        }}
        formatCurrency={formatCurrency}
        statusLabels={statusLabels}
        typeLabels={typeLabels}
      />
      </div>
    </ProtectedRoute>
  );
}