"use client";

import { fr } from "date-fns/locale";
import { Utensils, ShoppingBag, Bike, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, safeFormatDistanceToNow } from "@/lib/utils";
import type { Order, OrderStatus, OrderType } from "@/types/order";

const TYPE_ICONS: Record<OrderType, typeof Utensils> = {
  dine_in: Utensils,
  takeaway: ShoppingBag,
  delivery: Bike,
};

const STATUS_LABELS: Partial<Record<OrderStatus, string>> = {
  open: "En saisie",
  pending: "Envoyé",
  preparing: "En préparation",
  ready: "Prêt à servir",
  served: "Servi",
};

const STATUS_STYLES: Partial<Record<OrderStatus, string>> = {
  open: "bg-amber-100 text-amber-800 border-amber-200",
  pending: "bg-slate-100 text-slate-700 border-slate-200",
  preparing: "bg-blue-100 text-blue-800 border-blue-200",
  ready: "bg-emerald-100 text-emerald-800 border-emerald-200",
  served: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

export function TicketList({
  tickets,
  selectedId,
  onSelect,
  formatCurrency,
}: {
  tickets: Order[];
  selectedId: string | null;
  onSelect: (ticket: Order) => void;
  formatCurrency: (amount: number) => string;
}) {
  if (tickets.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center">
        <Utensils className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="font-medium">Aucun ticket ouvert</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Ouvrez un ticket pour commencer un service.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {tickets.map((ticket) => {
        const Icon = TYPE_ICONS[ticket.type] ?? Utensils;
        const draftCount = (ticket.orderItems ?? []).filter(
          (l) => l.status === "draft",
        ).length;
        const isSelected = ticket.id === selectedId;

        return (
          <li key={ticket.id}>
            <button
              type="button"
              onClick={() => onSelect(ticket)}
              aria-current={isSelected}
              className={cn(
                "w-full rounded-xl border p-3 text-left transition",
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "hover:bg-accent",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 font-semibold">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {ticket.table
                    ? `Table ${ticket.table.number}`
                    : `Ticket n°${ticket.number ?? "—"}`}
                </span>
                <span className="text-sm font-bold tabular-nums">
                  {formatCurrency(ticket.total ?? 0)}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Badge
                  variant="outline"
                  className={cn("font-normal", STATUS_STYLES[ticket.status])}
                >
                  {STATUS_LABELS[ticket.status] ?? ticket.status}
                </Badge>
                {draftCount > 0 && (
                  <Badge
                    variant="outline"
                    className="gap-1 border-amber-300 bg-amber-50 font-normal text-amber-800"
                  >
                    <AlertCircle className="h-3 w-3" />
                    {draftCount} à envoyer
                  </Badge>
                )}
              </div>

              <p className="mt-1.5 text-xs text-muted-foreground">
                N°{ticket.number ?? "—"} ·{" "}
                {safeFormatDistanceToNow(ticket.createdAt, {
                  addSuffix: true,
                  locale: fr,
                })}
              </p>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default TicketList;
