"use client";

import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { Permission } from "@/types/permissions";
import { PageHeader } from "@/components/ui/page-header";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";

import {
  StatisticsCards,
  FiltersSection,
  OrderCard,
  OrderForm,
  PaginationSection,
  OrderTicketPreview,
  OrderCancelConfirmation,
} from "@/components/customs/admin/orders";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

import { useOrders } from "@/hooks/api/useOrders";
import { useCreateOrder, useUpdateOrderStatus } from "@/hooks/api/useOrdersMutations";
import { useCustomers } from "@/hooks/api/useCustomers";
import { usePosCatalogue, useMenuCategories } from "@/hooks/api/useMenu";
import { useSocketEvent } from "@/hooks/useSocketEvent";
import { useTables } from "@/hooks/api/useTables";
import { Order, OrderStatus } from "@/types/order";
import { createOrderSchema } from "@/schemas/validation";
import { ORDER_STATUS_COLORS as statusColors, ORDER_STATUS_LABELS as statusLabels, ORDER_TYPE_LABELS as typeLabels } from "@/lib/order-utils";
import { useRestaurantCurrency } from "@/hooks/api/useRestaurant";

export default function OrdersPage() {
  const formatCurrency = useRestaurantCurrency();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OrderStatus | undefined>();
  const [type, setType] = useState<"dine_in" | "takeaway" | "delivery" | undefined>();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  
  const [startDate, setStartDate] = useState<Date | undefined>(today);
  const [endDate, setEndDate] = useState<Date | undefined>(endOfDay);
  const [sort, setSort] = useState<"date" | "total" | "status" | "createdAt">("date");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [ticketPreviewOrder, setTicketPreviewOrder] = useState<Order | null>(null);
  const [isTicketPreviewOpen, setIsTicketPreviewOpen] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [_deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      type: "dine_in" as const,
      items: [],
      specialNotes: "",
      tableId: undefined,
      customerId: undefined,
    },
  });

  // Rafraîchissement en temps réel via WebSockets NestJS
  useSocketEvent('new-order', useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["orders"] });
  }, [queryClient]));

  useSocketEvent('order-status-updated', useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["orders"] });
  }, [queryClient]));

  // Chargement des données via l'API NestJS
  const { data: ordersData, isLoading } = useOrders({
    search,
    status,
    type,
    page,
    limit,
  });

  const { data: catalogueData } = usePosCatalogue();
  const { data: categoriesData } = useMenuCategories();
  const { data: customersData } = useCustomers();
  const { data: tablesData } = useTables();

  const orders = (ordersData?.data || []).map((order: any) => ({
    ...order,
    date: new Date(order.createdAt),
    status: order.status as OrderStatus,
  })) as Order[];

  const pagination = ordersData?.pagination;

  // Statistiques calculées
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const preparingOrders = orders.filter(o => o.status === 'preparing').length;
  const completedOrders = orders.filter(o => o.status === 'served').length;
  const totalRevenue = orders.reduce((acc, o) => acc + (o?.total || 0), 0);

  // Mutations backend
  const createOrderMutation = useCreateOrder();
  const updateStatusMutation = useUpdateOrderStatus();

  const onSubmit = async (values: any) => {
    // Charge utile explicite : le formulaire porte aussi de l'état d'écran
    // (statut, total calculé, libellés des options) que l'API refuse — elle
    // rejette tout champ inconnu. Seul le contrat de CreateOrderDto part.
    const isDelivery = values.type === "delivery";
    const payload = {
      type: values.type,
      tableId:
        values.tableId && values.tableId !== "none" ? values.tableId : undefined,
      customerId: values.userId || undefined,
      specialNotes:
        values.specialNotes && values.specialNotes.trim() !== "-"
          ? values.specialNotes.trim()
          : undefined,
      deliveryAddress: isDelivery ? values.deliveryAddress || undefined : undefined,
      deliveryZoneId: isDelivery ? values.deliveryZoneId || undefined : undefined,
      deliveryFee: isDelivery ? values.deliveryFee || undefined : undefined,
      items: (values.items || []).map((item: any) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        selectedOptionIds: item.selectedOptionIds?.length
          ? item.selectedOptionIds
          : undefined,
        // Nom et prix ne servent qu'à un article hors carte : dès qu'il y a
        // un menuItemId, le serveur les relit en base.
        name: item.menuItemId ? undefined : item.name,
        price: item.menuItemId ? undefined : item.price,
      })),
    };

    createOrderMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Commande créée avec succès");
        setIsOpen(false);
        form.reset();
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Erreur lors de la création");
      }
    });
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateStatusMutation.mutate({ id: orderId, status: newStatus }, {
      onSuccess: () => {
        toast.success(`Statut mis à jour : ${statusLabels[newStatus]}`);
      }
    });
  };

  const handleCancelClick = (orderId: string) => {
    setCancelOrderId(orderId);
    setIsCancelDialogOpen(true);
  };

  const handleCancelConfirm = () => {
    if (cancelOrderId) {
      updateStatusMutation.mutate({ id: cancelOrderId, status: "cancelled" }, {
        onSuccess: () => {
          toast.error("Commande annulée");
          setIsCancelDialogOpen(false);
          setCancelOrderId(null);
        }
      });
    }
  };

  const handleAdd = () => {
    setSelectedOrder(null);
    form.reset();
    setIsOpen(true);
  };

  const handlePrintPDF = (order: Order) => {
    setTicketPreviewOrder(order);
    setIsTicketPreviewOpen(true);
  };

  const handleDeleteConfirm = () => {
    toast.info("Fonctionnalité à venir");
    setIsDeleteDialogOpen(false);
  };

  return (
    <ProtectedRoute requiredPermission={Permission.VIEW_ORDERS}>
      <div className="space-y-4 md:space-y-8">
        <PageHeader
          title="Commandes"
          subtitle="Gérez et suivez les commandes en temps réel"
          action={
            <PermissionGuard permission={Permission.CREATE_ORDERS}>
              <Button onClick={handleAdd} className="gap-2">
                <Plus className="h-4 w-4" />
                Nouvelle commande
              </Button>
            </PermissionGuard>
          }
        />

      {/* Statistiques */}
      <StatisticsCards
        totalOrders={totalOrders}
        pendingOrders={pendingOrders}
        preparingOrders={preparingOrders}
        completedOrders={completedOrders}
        totalRevenue={totalRevenue}
        formatCurrency={formatCurrency}
      />

      {/* Filtres */}
      <FiltersSection
        search={search}
        setSearch={setSearch}
        status={status}
        setStatus={setStatus}
        type={type}
        setType={setType}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        sort={sort}
        setSort={setSort}
        order={order}
        setOrder={setOrder}
        isLoading={isLoading}
      />

      {/* Liste des commandes */}
      <Card>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <p>Chargement des commandes...</p>
            </div>
          ) : !orders || orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-4">
              <p className="text-muted-foreground">Aucune commande trouvée</p>
              <Button onClick={handleAdd}>Créer votre première commande</Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                {orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusChange={handleStatusChange}
                    onCancel={handleCancelClick}
                    onPrintPDF={handlePrintPDF}
                    formatCurrency={formatCurrency}
                    statusColors={statusColors}
                    statusLabels={statusLabels}
                    typeLabels={typeLabels}
                    isUpdating={updateStatusMutation.isPending}
                  />
                ))}
              </div>
              {pagination && (
                <PaginationSection
                  page={page}
                  limit={limit}
                  total={pagination.total}
                  totalPages={pagination.pages}
                  onPageChange={setPage}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal d'édition */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[80vw] w-full max-h-[95vh] overflow-hidden flex flex-col sm:max-w-[95vw]">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              {selectedOrder ? "Modifier la commande" : "Nouvelle commande"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto min-h-0">
            <OrderForm 
              form={form}
              onSubmit={onSubmit}
              selectedOrder={selectedOrder}
              customers={customersData?.data || []}
              tables={Array.isArray(tablesData) ? tablesData : (tablesData?.data ?? [])}
              menuItems={Array.isArray(catalogueData) ? catalogueData : []}
              categories={Array.isArray(categoriesData) ? categoriesData : []}
            />
          </div>
        </DialogContent>
      </Dialog>

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

      {/* Confirmation d'annulation */}
      <OrderCancelConfirmation
        isOpen={isCancelDialogOpen}
        onClose={() => {
          setIsCancelDialogOpen(false);
          setCancelOrderId(null);
        }}
        onConfirm={handleCancelConfirm}
        orderId={cancelOrderId || ""}
        isLoading={updateStatusMutation.isPending}
      />

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setDeleteOrderId(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Supprimer la commande"
        description="Êtes-vous sûr de vouloir supprimer cette commande ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        isLoading={false}
        variant="destructive"
      />
      </div>
    </ProtectedRoute>
  );
}