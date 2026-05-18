"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Order, OrderStatus } from '@/types/order';
import { useSocketEvent } from "@/hooks/useSocketEvent";
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
import { useDashboardStats, useLatestOrders } from "@/hooks/api/useDashboard";
import { useUpdateOrderStatus } from "@/hooks/api/useOrdersMutations";
import { SetupBanner } from "@/components/admin/setup-banner";

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
  pending:   "bg-amber-100   text-amber-700   border-amber-200   dark:bg-amber-950/40  dark:text-amber-300",
  preparing: "bg-blue-100    text-blue-700    border-blue-200    dark:bg-blue-950/40   dark:text-blue-300",
  ready:     "bg-indigo-100  text-indigo-700  border-indigo-200  dark:bg-indigo-950/40 dark:text-indigo-300",
  served:    "bg-green-100   text-green-700   border-green-200   dark:bg-green-950/40  dark:text-green-300",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300",
  paid:      "bg-green-100   text-green-700   border-green-200   dark:bg-green-950/40  dark:text-green-300",
  cancelled: "bg-red-100     text-red-700     border-red-200     dark:bg-red-950/40    dark:text-red-300",
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

  const updateOrderMutation = useUpdateOrderStatus();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio("/notification.mp3");
    if (typeof window !== "undefined" && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
    return () => { audioRef.current = null; };
  }, []);

  // Query pour les statistiques
  const { data: statsData, isLoading: isLoadingStats } = useDashboardStats({ date: selectedDate });

  const { data: ordersData, isLoading: isLoadingOrders } = useLatestOrders({ 
    page, 
    perPage, 
    status: orderStatus 
  });

  const playNotification = useCallback(() => {
    audioRef.current?.play().catch(() => {});
  }, []);

  const handleNewOrder = useCallback((data: any) => {
    playNotification();
    if (Notification.permission === "granted") {
      const customerName = data?.order?.customer?.name || "Client inconnu";
      new Notification("Nouvelle commande", { body: `Commande de ${customerName}` });
    }
    queryClient.invalidateQueries({ queryKey: ["latest-orders"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
  }, [queryClient, playNotification]);

  const handleOrderStatusUpdated = useCallback((data: any) => {
    playNotification();
    if (Notification.permission === "granted") {
      new Notification("Commande mise à jour", { body: `Commande #${data.id} => ${data.status}` });
    }
    queryClient.invalidateQueries({ queryKey: ["latest-orders"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
  }, [queryClient, playNotification]);

  useSocketEvent("new-order", handleNewOrder);
  useSocketEvent("order-status-updated", handleOrderStatusUpdated);

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
      <div className="space-y-4 md:space-y-8">
        <SetupBanner />
        <DashboardHeader />
      
      <DashboardDateSelector
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

      <DashboardStatsCards
        statsData={statsData}
        isLoading={isLoadingStats}
      />

      <DashboardOrdersSection
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        orderStatus={orderStatus}
        onStatusChange={setOrderStatus}
        orders={ordersData?.orders || []}
        isLoading={isLoadingOrders}
        page={page}
        totalPages={ordersData?.pagination?.totalPages || 1}
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