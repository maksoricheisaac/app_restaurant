"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { fr } from "date-fns/locale";
import { ChefHat, Clock, CheckCircle2, Loader2, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useKitchenOrders } from "@/hooks/api/useOrders";
import { useUpdateOrderStatus } from "@/hooks/api/useOrdersMutations";
import { useSocketEvent } from "@/hooks/useSocketEvent";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import { Permission } from "@/types/permissions";
import { Order, OrderStatus } from "@/types/order";
import { toast } from "sonner";
import { cn, safeFormatDistanceToNow } from "@/lib/utils";

const STATUS_CONFIG = {
  pending: {
    label: "En attente",
    color: "bg-yellow-50 border-yellow-300",
    badge: "bg-yellow-100 text-yellow-800",
    dot: "bg-yellow-500",
  },
  preparing: {
    label: "En préparation",
    color: "bg-blue-50 border-blue-300",
    badge: "bg-blue-100 text-blue-800",
    dot: "bg-blue-500",
  },
} as const;

const TYPE_LABELS: Record<string, string> = {
  dine_in: "Sur place",
  takeaway: "À emporter",
  delivery: "Livraison",
};

function OrderCard({ order, onAction }: { order: Order; onAction: (id: string, status: OrderStatus) => void }) {
  const config = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG];
  const isPending = order.status === "pending";

  return (
    <div className={cn("rounded-xl border-2 p-4 space-y-3 transition-all", config?.color ?? "bg-white border-gray-200")}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-slate-900">
              {order.table ? `Table ${order.table.number}` : TYPE_LABELS[order.type] ?? order.type}
            </span>
            <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", config?.badge)}>
              {config?.label}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {safeFormatDistanceToNow(order.createdAt, { addSuffix: true, locale: fr })}
          </div>
        </div>
        <div className={cn("h-3 w-3 rounded-full animate-pulse mt-1", config?.dot)} />
      </div>

      {/* Items */}
      <ul className="space-y-1.5">
        {order.orderItems?.map((item: any) => (
          <li key={item.id} className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-800">
              <span className="text-base font-black mr-1">{item.quantity}×</span>
              {item.name}
            </span>
          </li>
        ))}
      </ul>

      {order.specialNotes && (
        <p className="text-xs bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-amber-800 font-medium">
          📝 {order.specialNotes}
        </p>
      )}

      {/* Action */}
      <div className="pt-1">
        {isPending ? (
          <Button
            className="w-full"
            onClick={() => onAction(order.id, "preparing")}
          >
            <ChefHat className="h-4 w-4 mr-2" />
            Commencer la préparation
          </Button>
        ) : (
          <Button
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={() => onAction(order.id, "ready")}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Marquer comme prête
          </Button>
        )}
      </div>
    </div>
  );
}

export default function KitchenPage() {
  const queryClient = useQueryClient();
  const updateStatus = useUpdateOrderStatus();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    audioRef.current = new Audio("/notification.mp3");
    // Refresh timestamps every 30s
    const interval = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => {
      clearInterval(interval);
      audioRef.current = null;
    };
  }, []);

  const { data: kitchenData } = useKitchenOrders();

  const allKitchenOrders = (kitchenData as Order[] | undefined) ?? [];
  const pendingOrders = allKitchenOrders.filter((o) => o.status === "pending");
  const preparingOrders = allKitchenOrders.filter((o) => o.status === "preparing");

  const invalidateKitchen = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
  }, [queryClient]);

  const handleNewOrder = useCallback(() => {
    audioRef.current?.play().catch(() => {});
    invalidateKitchen();
  }, [invalidateKitchen]);

  useSocketEvent("new-order", handleNewOrder);
  useSocketEvent("order-status-updated", invalidateKitchen);

  function handleAction(id: string, status: OrderStatus) {
    updateStatus.mutate({ id, status }, {
      onSuccess: () => {
        toast.success(status === "ready" ? "Commande prête !" : "Préparation lancée");
        invalidateKitchen();
      },
    });
  }

  const totalActive = pendingOrders.length + preparingOrders.length;

  return (
    <ProtectedRoute requiredPermission={Permission.VIEW_ORDERS}>
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white">
              <ChefHat className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Cuisine</h1>
              <p className="text-sm text-muted-foreground">
                {totalActive === 0
                  ? "Aucune commande en cours"
                  : `${totalActive} commande${totalActive > 1 ? "s" : ""} active${totalActive > 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
          {totalActive > 0 && (
            <div className="flex items-center gap-2 text-sm font-semibold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full">
              <Bell className="h-4 w-4" />
              {totalActive} en cours
            </div>
          )}
        </div>

        {/* Empty state */}
        {totalActive === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <ChefHat className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <p className="text-xl font-bold text-slate-700">Tout est tranquille</p>
            <p className="text-sm text-muted-foreground mt-1">
              Les nouvelles commandes apparaîtront ici automatiquement.
            </p>
          </div>
        )}

        {/* Columns */}
        {totalActive > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                <h2 className="font-bold text-slate-800">
                  En attente{" "}
                  {pendingOrders.length > 0 && (
                    <span className="text-yellow-600">({pendingOrders.length})</span>
                  )}
                </h2>
              </div>
              {pendingOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Aucune commande en attente</p>
              ) : (
                pendingOrders.map((order) => (
                  <OrderCard key={order.id} order={order} onAction={handleAction} />
                ))
              )}
            </div>

            {/* Preparing */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                <h2 className="font-bold text-slate-800">
                  En préparation{" "}
                  {preparingOrders.length > 0 && (
                    <span className="text-blue-600">({preparingOrders.length})</span>
                  )}
                </h2>
              </div>
              {preparingOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Aucune commande en préparation</p>
              ) : (
                preparingOrders.map((order) => (
                  <OrderCard key={order.id} order={order} onAction={handleAction} />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
