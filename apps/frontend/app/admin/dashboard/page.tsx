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
import { ORDER_STATUS_COLORS as statusColors, ORDER_STATUS_LABELS as statusLabels, ORDER_TYPE_LABELS as typeLabels } from "@/lib/order-utils";
import { useTenantCurrency } from "@/hooks/useTenantCurrency";

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
  const formatCurrency = useTenantCurrency();
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

  const getStatusBadgeColor = (status: string) =>
    statusColors[status as keyof typeof statusColors] ?? 'bg-gray-100 text-gray-800 border-gray-200';

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