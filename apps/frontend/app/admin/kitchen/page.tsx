"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { fr } from "date-fns/locale";
import { ChefHat, Clock, CheckCircle2, Bell, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useKitchenOrders } from "@/hooks/api/useOrders";
import { useAdvanceLine } from "@/hooks/api/useTickets";
import { useSocketEvent } from "@/hooks/useSocketEvent";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import { OrderItemOptions } from "@/components/common/order-item-options";
import { Permission } from "@/types/permissions";
import { Order, OrderItem, OrderLineStatus } from "@/types/order";
import { toast } from "sonner";
import { cn, safeFormatDistanceToNow } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  dine_in: "Sur place",
  takeaway: "À emporter",
  delivery: "Livraison",
};

/** Colonnes de l'écran : une ligne y est rangée par son propre statut. */
const COLUMNS: {
  status: OrderLineStatus;
  title: string;
  dot: string;
  accent: string;
  next: OrderLineStatus;
  action: string;
  icon: typeof Play;
}[] = [
  {
    status: "sent",
    title: "À lancer",
    dot: "bg-yellow-500",
    accent: "border-yellow-300 bg-yellow-50",
    next: "preparing",
    action: "Lancer",
    icon: Play,
  },
  {
    status: "preparing",
    title: "En préparation",
    dot: "bg-blue-500",
    accent: "border-blue-300 bg-blue-50",
    next: "ready",
    action: "Marquer prêt",
    icon: ChefHat,
  },
  {
    status: "ready",
    title: "Prêt à servir",
    dot: "bg-emerald-500",
    accent: "border-emerald-300 bg-emerald-50",
    next: "served",
    action: "Servi",
    icon: CheckCircle2,
  },
];

/** Une ligne, rattachée au ticket dont elle vient. */
interface KitchenLine {
  line: OrderItem;
  order: Order;
}

/**
 * Minutes écoulées depuis l'envoi. Sert à colorer les retards : au-delà de
 * 15 minutes sans être lancée, une ligne devient visible de loin.
 */
function minutesSince(value?: string | Date | null): number {
  if (!value) return 0;
  return (Date.now() - new Date(value).getTime()) / 60_000;
}

function LineCard({
  entry,
  column,
  onAdvance,
  isBusy,
}: {
  entry: KitchenLine;
  column: (typeof COLUMNS)[number];
  onAdvance: () => void;
  isBusy: boolean;
}) {
  const { line, order } = entry;
  const waited = minutesSince(line.sentAt);
  const isLate = column.status !== "ready" && waited > 15;
  const Icon = column.icon;

  return (
    <div
      className={cn(
        "space-y-2 rounded-xl border-2 p-3 transition-all",
        column.accent,
        isLate && "border-red-400 ring-2 ring-red-200",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-lg font-black leading-tight text-slate-900">
            {line.quantity}× {line.name}
          </p>
          {/* Sans les options, un bon de préparation est inexploitable dès
              qu'un plat porte une cuisson ou un supplément. */}
          <OrderItemOptions options={line.options} tone="kitchen" />
        </div>
        <Badge variant="outline" className="shrink-0 bg-white font-semibold">
          {order.table ? `T${order.table.number}` : TYPE_LABELS[order.type]}
        </Badge>
      </div>

      <div className="flex items-center justify-between gap-2 text-xs">
        <span
          className={cn(
            "flex items-center gap-1",
            isLate ? "font-bold text-red-700" : "text-muted-foreground",
          )}
        >
          <Clock className="h-3 w-3" />
          {safeFormatDistanceToNow(line.sentAt ?? order.createdAt, {
            addSuffix: true,
            locale: fr,
          })}
        </span>
        <span className="text-muted-foreground">
          N°{order.number ?? "—"}
        </span>
      </div>

      {order.specialNotes && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs font-medium text-amber-800">
          📝 {order.specialNotes}
        </p>
      )}

      <Button
        className="w-full gap-2"
        size="sm"
        disabled={isBusy}
        onClick={onAdvance}
      >
        <Icon className="h-4 w-4" />
        {column.action}
      </Button>
    </div>
  );
}

export default function KitchenPage() {
  const queryClient = useQueryClient();
  const advanceLine = useAdvanceLine();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    audioRef.current = new Audio("/notification.mp3");
    // Rafraîchit les durées d'attente, et donc les alertes de retard.
    const interval = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => {
      clearInterval(interval);
      audioRef.current = null;
    };
  }, []);

  const { data: kitchenData } = useKitchenOrders();
  const orders = (kitchenData as Order[] | undefined) ?? [];

  // Le serveur ne renvoie déjà que les lignes qui concernent la cuisine ;
  // on les aplatit pour les ranger par statut plutôt que par ticket.
  const linesByStatus = useMemo(() => {
    const buckets = new Map<OrderLineStatus, KitchenLine[]>();
    for (const column of COLUMNS) buckets.set(column.status, []);

    for (const order of orders) {
      for (const line of order.orderItems ?? []) {
        buckets.get(line.status)?.push({ line, order });
      }
    }

    for (const entries of buckets.values()) {
      entries.sort(
        (a, b) =>
          new Date(a.line.sentAt ?? a.order.createdAt).getTime() -
          new Date(b.line.sentAt ?? b.order.createdAt).getTime(),
      );
    }

    return buckets;
  }, [orders]);

  const invalidateKitchen = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["kitchen-orders"] });
  }, [queryClient]);

  const handleNewOrder = useCallback(() => {
    audioRef.current?.play().catch(() => {});
    invalidateKitchen();
  }, [invalidateKitchen]);

  useSocketEvent("new-order", handleNewOrder);
  useSocketEvent("order-status-updated", invalidateKitchen);
  useSocketEvent("ticket-updated", invalidateKitchen);

  const totalActive = COLUMNS.reduce(
    (sum, column) => sum + (linesByStatus.get(column.status)?.length ?? 0),
    0,
  );

  const advance = (entry: KitchenLine, next: OrderLineStatus) => {
    advanceLine.mutate(
      { orderId: entry.order.id, lineId: entry.line.id, status: next },
      {
        onSuccess: () => invalidateKitchen(),
        onError: (error: any) =>
          toast.error(
            error?.response?.data?.message ?? "Impossible de faire avancer ce plat",
          ),
      },
    );
  };

  return (
    <ProtectedRoute requiredPermission={Permission.VIEW_ORDERS}>
      <div className="space-y-6 pb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white">
              <ChefHat className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Cuisine</h1>
              <p className="text-sm text-muted-foreground">
                {totalActive === 0
                  ? "Aucun plat en cours"
                  : `${totalActive} plat${totalActive > 1 ? "s" : ""} en cours`}
              </p>
            </div>
          </div>
          {totalActive > 0 && (
            <div className="flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-sm font-semibold text-orange-600">
              <Bell className="h-4 w-4" />
              {totalActive}
            </div>
          )}
        </div>

        {totalActive === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <ChefHat className="mb-4 h-16 w-16 text-muted-foreground/30" />
            <p className="text-xl font-bold text-slate-700">Tout est tranquille</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Les plats envoyés en cuisine apparaîtront ici automatiquement.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {COLUMNS.map((column) => {
              const entries = linesByStatus.get(column.status) ?? [];
              return (
                <div key={column.status} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className={cn("h-2.5 w-2.5 rounded-full", column.dot)} />
                    <h2 className="font-bold text-slate-800">
                      {column.title}
                      {entries.length > 0 && (
                        <span className="ml-1 text-muted-foreground">
                          ({entries.length})
                        </span>
                      )}
                    </h2>
                  </div>

                  {entries.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      Rien ici
                    </p>
                  ) : (
                    entries.map((entry) => (
                      <LineCard
                        key={entry.line.id}
                        entry={entry}
                        column={column}
                        isBusy={advanceLine.isPending}
                        onAdvance={() => advance(entry, column.next)}
                      />
                    ))
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
