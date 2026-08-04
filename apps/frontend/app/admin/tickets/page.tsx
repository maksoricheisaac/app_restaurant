"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Send, CreditCard, Ban } from "lucide-react";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";
import { PermissionGuard } from "@/components/admin/PermissionGuard";
import { Permission } from "@/types/permissions";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {
  TicketList,
  TicketLines,
  AddLinesSheet,
  VoidLineDialog,
  NewTicketDialog,
  type CatalogueItem,
} from "@/components/customs/admin/tickets";

import {
  useOpenTickets,
  useAddTicketLines,
  useUpdateTicketLineQuantity,
  useRemoveTicketLine,
  useVoidTicketLine,
  useSendTicketToKitchen,
} from "@/hooks/api/useTickets";
import { useCreateOrder } from "@/hooks/api/useOrdersMutations";
import { usePosCatalogue, useMenuCategories } from "@/hooks/api/useMenu";
import { useTables } from "@/hooks/api/useTables";
import { useRestaurantCurrency } from "@/hooks/api/useRestaurant";
import { useSocketEvent } from "@/hooks/useSocketEvent";
import { usePermissions } from "@/hooks/usePermissions";
import type { Order, OrderItem, OrderType } from "@/types/order";

/**
 * Service en salle.
 *
 * Un ticket vit ici pendant tout le repas : on l'ouvre vide, on y ajoute des
 * tournées, on les envoie en cuisine, on corrige, puis on encaisse. C'est le
 * parcours que rendait impossible l'ancien modèle, où une commande était
 * figée à sa création.
 */
export default function TicketsPage() {
  const router = useRouter();
  const formatCurrency = useRestaurantCurrency();
  const { hasPermission } = usePermissions();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [lineToVoid, setLineToVoid] = useState<OrderItem | null>(null);

  const { data: tickets = [], isLoading, refetch } = useOpenTickets();
  const { data: catalogueData } = usePosCatalogue();
  const { data: categoriesData } = useMenuCategories();
  const { data: tablesData } = useTables();

  const createOrder = useCreateOrder();
  const addLines = useAddTicketLines();
  const updateQuantity = useUpdateTicketLineQuantity();
  const removeLine = useRemoveTicketLine();
  const voidLine = useVoidTicketLine();
  const sendToKitchen = useSendTicketToKitchen();

  // Un ticket modifié par un autre poste doit apparaître ici sans rechargement.
  const refresh = useCallback(() => void refetch(), [refetch]);
  useSocketEvent("ticket-updated", refresh);
  useSocketEvent("ticket-opened", refresh);
  useSocketEvent("new-order", refresh);
  useSocketEvent("order-status-updated", refresh);

  const catalogue: CatalogueItem[] = Array.isArray(catalogueData)
    ? catalogueData
    : [];
  const categories = Array.isArray(categoriesData) ? categoriesData : [];
  const tables = Array.isArray(tablesData) ? tablesData : (tablesData?.data ?? []);

  const selected: Order | null = useMemo(
    () => tickets.find((t) => t.id === selectedId) ?? null,
    [tickets, selectedId],
  );

  const lines = selected?.orderItems ?? [];
  const draftCount = lines.filter((l) => l.status === "draft").length;
  const occupiedTableIds = tickets
    .map((t) => t.tableId)
    .filter((id): id is string => Boolean(id));

  const isBusy =
    addLines.isPending ||
    updateQuantity.isPending ||
    removeLine.isPending ||
    voidLine.isPending ||
    sendToKitchen.isPending;

  const failWith = (fallback: string) => (error: any) =>
    toast.error(error?.response?.data?.message ?? fallback);

  const handleCreate = (input: { type: OrderType; tableId?: string }) => {
    createOrder.mutate(
      {
        type: input.type,
        tableId: input.tableId,
        // Un ticket s'ouvre vide : le serveur y ajoutera les articles ensuite.
        items: [],
        sendImmediately: false,
      },
      {
        onSuccess: (order: any) => {
          toast.success(`Ticket n°${order?.number ?? ""} ouvert`);
          setIsNewOpen(false);
          setSelectedId(order?.id ?? null);
          setIsAddOpen(true);
          void refetch();
        },
        onError: failWith("Impossible d'ouvrir le ticket"),
      },
    );
  };

  const handleAddLines = (items: unknown[], sendImmediately: boolean) => {
    if (!selected) return;
    addLines.mutate(
      { orderId: selected.id, items, sendImmediately },
      {
        onSuccess: () => {
          toast.success(
            sendImmediately ? "Tournée envoyée en cuisine" : "Articles ajoutés",
          );
          setIsAddOpen(false);
        },
        onError: failWith("Impossible d'ajouter ces articles"),
      },
    );
  };

  const handleSend = () => {
    if (!selected) return;
    sendToKitchen.mutate(selected.id, {
      onSuccess: () => toast.success("Tournée envoyée en cuisine"),
      onError: failWith("Impossible d'envoyer en cuisine"),
    });
  };

  const changeQuantity = (line: OrderItem, delta: number) => {
    if (!selected) return;
    updateQuantity.mutate(
      { orderId: selected.id, lineId: line.id, quantity: line.quantity + delta },
      { onError: failWith("Impossible de modifier la quantité") },
    );
  };

  const handleRemove = (line: OrderItem) => {
    if (!selected) return;
    removeLine.mutate(
      { orderId: selected.id, lineId: line.id },
      {
        onSuccess: () => toast.success("Ligne retirée"),
        onError: failWith("Impossible de retirer cette ligne"),
      },
    );
  };

  const handleVoid = (reason: string) => {
    if (!selected || !lineToVoid) return;
    voidLine.mutate(
      { orderId: selected.id, lineId: lineToVoid.id, reason },
      {
        onSuccess: () => {
          toast.success("Ligne annulée, stock restitué");
          setLineToVoid(null);
        },
        onError: failWith("Impossible d'annuler cette ligne"),
      },
    );
  };

  return (
    <ProtectedRoute requiredPermission={Permission.VIEW_ORDERS}>
      <div className="space-y-4 md:space-y-6">
        <PageHeader
          title="Service en salle"
          subtitle="Tickets ouverts — ajoutez, envoyez et corrigez au fil du repas"
          action={
            <PermissionGuard permission={Permission.CREATE_ORDERS}>
              <Button onClick={() => setIsNewOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Ouvrir un ticket
              </Button>
            </PermissionGuard>
          }
        />

        <div className="grid gap-4 lg:grid-cols-[minmax(260px,340px)_1fr]">
          {/* Tickets ouverts */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {isLoading
                ? "Chargement…"
                : `${tickets.length} ticket${tickets.length > 1 ? "s" : ""} ouvert${tickets.length > 1 ? "s" : ""}`}
            </h2>
            <TicketList
              tickets={tickets}
              selectedId={selectedId}
              onSelect={(ticket) => setSelectedId(ticket.id)}
              formatCurrency={formatCurrency}
            />
          </div>

          {/* Détail du ticket */}
          <Card className="min-h-[24rem]">
            <CardContent className="p-4 md:p-6">
              {!selected ? (
                <div className="flex h-64 flex-col items-center justify-center text-center">
                  <p className="font-medium">Aucun ticket sélectionné</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Choisissez un ticket à gauche, ou ouvrez-en un nouveau.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
                    <div>
                      <h2 className="text-xl font-bold">
                        {selected.table
                          ? `Table ${selected.table.number}`
                          : "À emporter"}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Ticket n°{selected.number ?? "—"} ·{" "}
                        {lines.length} ligne{lines.length > 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-2xl font-bold tabular-nums">
                        {formatCurrency(selected.total ?? 0)}
                      </p>
                    </div>
                  </div>

                  <TicketLines
                    lines={lines}
                    formatCurrency={formatCurrency}
                    canVoid={hasPermission(Permission.MANAGE_ORDER_STATUS)}
                    isBusy={isBusy}
                    onIncrement={(line) => changeQuantity(line, 1)}
                    onDecrement={(line) => changeQuantity(line, -1)}
                    onRemove={handleRemove}
                    onVoid={setLineToVoid}
                  />

                  <div className="flex flex-wrap gap-2 border-t pt-4">
                    <PermissionGuard permission={Permission.CREATE_ORDERS}>
                      <Button
                        variant="outline"
                        className="gap-2"
                        disabled={isBusy}
                        onClick={() => setIsAddOpen(true)}
                      >
                        <Plus className="h-4 w-4" />
                        Ajouter des articles
                      </Button>
                    </PermissionGuard>

                    <Button
                      className="gap-2"
                      disabled={draftCount === 0 || isBusy}
                      onClick={handleSend}
                    >
                      <Send className="h-4 w-4" />
                      Envoyer en cuisine
                      {draftCount > 0 && (
                        <Badge variant="secondary" className="ml-1">
                          {draftCount}
                        </Badge>
                      )}
                    </Button>

                    <PermissionGuard permission={Permission.MANAGE_PAYMENTS}>
                      <Button
                        variant="secondary"
                        className="gap-2"
                        disabled={draftCount > 0 || lines.length === 0}
                        title={
                          draftCount > 0
                            ? "Envoyez ou retirez les lignes en attente avant d'encaisser"
                            : undefined
                        }
                        onClick={() => router.push("/admin/cash-register")}
                      >
                        <CreditCard className="h-4 w-4" />
                        Encaisser
                      </Button>
                    </PermissionGuard>
                  </div>

                  {draftCount > 0 && (
                    <p className="flex items-center gap-1.5 text-xs text-amber-700">
                      <Ban className="h-3.5 w-3.5" />
                      {draftCount} ligne{draftCount > 1 ? "s" : ""} en attente
                      d&apos;envoi — l&apos;encaissement est bloqué tant
                      qu&apos;elle{draftCount > 1 ? "s ne sont" : " n'est"} pas
                      partie{draftCount > 1 ? "s" : ""} en cuisine.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <NewTicketDialog
          isOpen={isNewOpen}
          onClose={() => setIsNewOpen(false)}
          tables={tables}
          occupiedTableIds={occupiedTableIds}
          onConfirm={handleCreate}
          isPending={createOrder.isPending}
        />

        <AddLinesSheet
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          catalogue={catalogue}
          categories={categories}
          formatCurrency={formatCurrency}
          onSubmit={handleAddLines}
          isPending={addLines.isPending}
        />

        <VoidLineDialog
          line={lineToVoid}
          isOpen={lineToVoid !== null}
          onClose={() => setLineToVoid(null)}
          onConfirm={handleVoid}
          isPending={voidLine.isPending}
        />
      </div>
    </ProtectedRoute>
  );
}
