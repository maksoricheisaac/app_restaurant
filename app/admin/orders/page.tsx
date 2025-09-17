"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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

import {
  createOrder,
  getOrdersWithFilters,
  updateOrder,
  updateOrderStatus,
} from "@/actions/admin/order-actions";
import { getPublicMenu, getPublicCategories } from "@/actions/public/menu-actions";
import { getTables } from "@/actions/admin/table-actions";
import { getCustomers } from "@/actions/admin/customer-actions";
import { usePusher } from "@/hooks/usePusher";
import { Order, OrderStatus } from "@/types/order";

const orderItemSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  quantity: z.number().min(1, "La quantité doit être au moins 1"),
  price: z.number().min(0, "Le prix doit être positif"),
});

const formSchema = z.object({
  // customerId optional to allow staff to create walk-in orders
  customerId: z.string().min(0,"ID client invalide").optional(),
  // contact info optional when staff creates a simplified order
  email: z.string().optional(),
  phone: z.string().optional(),
  items: z.array(orderItemSchema).min(1, "La commande doit avoir au moins un article"),
  total: z.number().min(0, "Le total doit être positif"),
  status: z.enum(["pending", "preparing", "ready", "served", "completed", "paid", "cancelled"]),
  type: z.enum(["dine_in", "takeaway", "delivery"]),
  time: z.string(),
  date: z.date(),
  tableId: z.string().nullable(),
});

type FormValues = z.infer<typeof formSchema>;



type OrderInput = Omit<FormValues, "date" | "tableId"> & {
  date: string;
  tableId?: string;
  userId?: string; // optional to support staff-created orders without a linked user
};

type OrderUpdateInput = OrderInput & {
  id: string;
  userId?: string;
};

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

const fetchOrders = async (
  search: string,
  status: OrderStatus | undefined,
  type: "dine_in" | "takeaway" | "delivery" | undefined,
  startDate: Date | undefined,
  endDate: Date | undefined,
  sort: "date" | "total" | "status" | "createdAt",
  order: "asc" | "desc",
  page: number,
  limit: number
) => {
  const result = await getOrdersWithFilters({
    search,
    status,
    type,
    date: startDate?.toISOString(),
    page,
    limit,
  });

  if (!result.data) {
    throw new Error("Échec du chargement des commandes");
  }
  
  return result.data;
};

// Fonction de formatage de la monnaie
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"pending" | "preparing" | "ready" | "completed" | "cancelled" | undefined>();
  const [type, setType] = useState<"dine_in" | "takeaway" | "delivery" | undefined>();
  
  // Initialiser avec la date du jour
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
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: "cl_comptoir_user",
      email: "",
      phone: "",
      items: [],
      total: 0,
      status: "pending" as const,
      type: "dine_in" as const,
      time: "",
      date: new Date(),
      tableId: "",
    },
  });

  // Configuration Pusher pour les commandes
  usePusher({
    channel: 'restaurant-channel',
    events: ['new-order', 'order-updated', 'order-status-updated', 'order-deleted'],
    onEvent: (event) => {
      switch (event) {
        case 'new-order':
          toast.success('Nouvelle commande reçue !');
          queryClient.invalidateQueries({ queryKey: ["orders"] });
          break;
        case 'order-updated':
          toast.info('Commande mise à jour');
          queryClient.invalidateQueries({ queryKey: ["orders"] });
          break;
        case 'order-status-updated':
          toast.info('Statut de commande mis à jour');
          queryClient.invalidateQueries({ queryKey: ["orders"] });
          break;
        case 'order-deleted':
          toast.info('Commande supprimée');
          queryClient.invalidateQueries({ queryKey: ["orders"] });
          break;
      }
    },
  });

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["orders", search, status, type, startDate, endDate, sort, order, page, limit],
    queryFn: () => fetchOrders(
      search,
      status === "ready" ? "served" : status,
      type,
      startDate,
      endDate,
      sort,
      order,
      page,
      limit
    ),
  });

  const { data: tablesData } = useQuery({
    queryKey: ["tables"],
    queryFn: () => getTables({}),
    refetchInterval: 50000,
  });

  const { data: customersData } = useQuery({
    queryKey: ["customers"],
    queryFn: () => getCustomers({}),
    refetchInterval: 10000,
  });

  const { data: menuData } = useQuery({
    queryKey: ["menu"],
    queryFn: () => getPublicMenu({}),
    refetchInterval: 0,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["menu-categories"],
    queryFn: () => getPublicCategories(),
    refetchInterval: 0,
  });

  // Transform the data to match the expected Order type
  const orders = (ordersData?.data?.orders || []).map((order: {
    id: string;
    status: string;
    type: string;
    createdAt: Date;
    updatedAt: Date;
    total?: number | null;
    userId: string;
    tableId?: string | null;
    user: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
    };
    table?: {
      id: string;
      number: number;
      seats: number;
    } | null;
    orderItems: Array<{
      id: string;
      orderId: string;
      menuItemId?: string; // Accept optional for mapping
      name: string;
      quantity: number;
      price: number;
      image?: string | null;
    }>;
  }) => ({
    ...order,
    date: order.createdAt,
    status: order.status as OrderStatus,
    type: order.type as "dine_in" | "takeaway" | "delivery",
    orderItems: order.orderItems.map(item => ({
      ...item,
      menuItemId: item.menuItemId ?? "", // Provide a default value if missing
    })),
  }));

  const pagination = ordersData?.data?.pagination;

  // Statistiques des commandes
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const preparingOrders = orders.filter(o => o.status === 'preparing').length;
  const completedOrders = orders.filter(o => o.status === 'served').length;
  const totalRevenue = orders.reduce((acc, o) => acc + (o?.total || 0), 0);

  const createOrderMutation = useMutation({
    mutationFn: async (input: OrderInput) => {
      const result = await createOrder(input);
      if (!result.data) {
        console.log(result.serverError)
        console.log(result.validationErrors)
        throw new Error("Échec de la création de la commande");
        
      }
      
      return result.data;
    },
    onSuccess: () => {
      toast.success("Commande créée avec succès");
      setIsOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async (input: OrderUpdateInput) => {
      const result = await updateOrder(input);
      if (!result.data) {
        throw new Error("Échec de la mise à jour de la commande");
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success("Commande mise à jour avec succès");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const result = await updateOrderStatus({ orderId: id, status });
      if (!result.data) {
        throw new Error("Échec de la mise à jour du statut de la commande");
      }
      return result.data;
    },
    onSuccess: (data, variables) => {
      const { status } = variables;
      
      // Message personnalisé selon le statut
      if (status === "preparing") {
        toast.success("✅ Commande validée ! Elle est maintenant en préparation.", {
          description: "Le client peut suivre l'état de sa commande.",
          duration: 4000,
        });
      } else if (status === "served") {
        toast.success("🎉 Commande servie ! Le client peut la récupérer.", {
          description: "La commande est terminée et disponible.",
          duration: 4000,
        });
      } else if (status === "cancelled") {
        toast.error("❌ Commande annulée", {
          description: "La commande a été annulée.",
          duration: 3000,
        });
      } else {
        toast.success("Statut de la commande mis à jour avec succès");
      }
      
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = async (values: FormValues) => {
    const input = {
      ...values,
      date: values.date.toISOString(),
    };
    if (selectedOrder) {
      updateOrderMutation.mutate({
        ...input,
        id: selectedOrder.id,
        userId: selectedOrder.userId,
        tableId: input.tableId || undefined,
      });
    } else {
      createOrderMutation.mutate({
        ...input,
        // pass undefined when no customerId so server can fallback to a guest user
        userId: input.customerId || undefined,
        tableId: input.tableId || undefined,
      });
    }
  };

  const handleAdd = () => {
    setSelectedOrder(null);
    form.reset({
      customerId: "cl_comptoir_user",
      email: "",
      phone: "",
      items: [],
      total: 0,
      status: "pending",
      type: "dine_in",
      time: "",
      date: new Date(),
      tableId: undefined,
    });
    setIsOpen(true);
  };

  const handlePrintPDF = (order: Order) => {
    setTicketPreviewOrder(order);
    setIsTicketPreviewOpen(true);
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    const order = orders.find(o => o.id === orderId);
    if (order && order.status !== newStatus) {
      updateOrderStatusMutation.mutate({
        id: orderId,
        status: newStatus,
      });
    }
  };

  const handleCancelClick = (orderId: string) => {
    setCancelOrderId(orderId);
    setIsCancelDialogOpen(true);
  };

  const handleCancelConfirm = () => {
    if (cancelOrderId) {
      const order = orders.find(o => o.id === cancelOrderId);
      if (order && order.status !== "cancelled") {
        updateOrderStatusMutation.mutate({
          id: cancelOrderId,
          status: "cancelled",
        });
      }
    }
    setIsCancelDialogOpen(false);
    setCancelOrderId(null);
  };

  

  const handleDeleteConfirm = () => {
    if (deleteOrderId) {
      // Ici vous devrez implémenter la mutation de suppression
      // deleteOrderMutation.mutate({ id: deleteOrderId });
      toast.info("Fonctionnalité de suppression à implémenter");
      setIsDeleteDialogOpen(false);
      setDeleteOrderId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Commandes</h1>
          <p className="text-gray-500 mt-2">
            Gérez les commandes de votre restaurant
          </p>
        </div>
        <Button onClick={handleAdd} className="cursor-pointer">
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle commande
        </Button>
      </div>

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
                    isUpdating={updateOrderStatusMutation.isPending}
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
        <DialogContent className="max-w-[60vw] w-[60vw] h-[90vh] overflow-hidden flex flex-col sm:max-w-[98vw]">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              {selectedOrder ? "Modifier la commande" : "Nouvelle commande"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <OrderForm 
              form={form}
              onSubmit={onSubmit}
              selectedOrder={selectedOrder}
              customers={customersData?.data?.data || []}
              tables={tablesData?.data?.data || []}
              menuItems={menuData?.data?.data?.items || []}
              categories={categoriesData?.data?.data || []}
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
        isLoading={updateOrderStatusMutation.isPending}
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
  );
}