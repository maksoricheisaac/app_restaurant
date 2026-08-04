"use client";

import { Minus, Plus, Trash2, Ban, Clock } from "lucide-react";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrderItemOptions } from "@/components/common/order-item-options";
import { cn, safeFormatDistanceToNow } from "@/lib/utils";
import type { OrderItem, OrderLineStatus } from "@/types/order";

const LINE_STATUS_LABELS: Record<OrderLineStatus, string> = {
  draft: "À envoyer",
  sent: "En cuisine",
  preparing: "En préparation",
  ready: "Prêt",
  served: "Servi",
  cancelled: "Annulé",
};

const LINE_STATUS_STYLES: Record<OrderLineStatus, string> = {
  draft: "bg-amber-100 text-amber-800 border-amber-200",
  sent: "bg-slate-100 text-slate-700 border-slate-200",
  preparing: "bg-blue-100 text-blue-800 border-blue-200",
  ready: "bg-emerald-100 text-emerald-800 border-emerald-200",
  served: "bg-emerald-50 text-emerald-700 border-emerald-100",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

/** Regroupe les lignes parties par tournée : elles partagent leur `sentAt`. */
function groupByRound(lines: OrderItem[]): { sentAt: string; lines: OrderItem[] }[] {
  const rounds = new Map<string, OrderItem[]>();

  for (const line of lines) {
    const key = line.sentAt ? new Date(line.sentAt).toISOString() : "—";
    const bucket = rounds.get(key) ?? [];
    bucket.push(line);
    rounds.set(key, bucket);
  }

  return [...rounds.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([sentAt, grouped]) => ({ sentAt, lines: grouped }));
}

function LineRow({
  line,
  formatCurrency,
  onIncrement,
  onDecrement,
  onRemove,
  onVoid,
  canVoid,
  isBusy,
}: {
  line: OrderItem;
  formatCurrency: (amount: number) => string;
  onIncrement?: () => void;
  onDecrement?: () => void;
  onRemove?: () => void;
  onVoid?: () => void;
  canVoid: boolean;
  isBusy?: boolean;
}) {
  const isDraft = line.status === "draft";
  const isCancelled = line.status === "cancelled";

  return (
    <li
      className={cn(
        "flex items-start gap-3 rounded-lg border p-3",
        isCancelled ? "border-red-100 bg-red-50/40" : "bg-card",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "font-medium",
              isCancelled && "line-through text-muted-foreground",
            )}
          >
            {line.quantity}× {line.name}
          </span>
          <Badge
            variant="outline"
            className={cn("font-normal", LINE_STATUS_STYLES[line.status])}
          >
            {LINE_STATUS_LABELS[line.status]}
          </Badge>
        </div>

        <OrderItemOptions options={line.options} />

        {isCancelled && line.cancelReason && (
          <p className="mt-1 text-xs text-red-700">Motif : {line.cancelReason}</p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isDraft && (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={isBusy || line.quantity <= 1}
              onClick={onDecrement}
              aria-label={`Diminuer la quantité de ${line.name}`}
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <span className="w-6 text-center text-sm tabular-nums">
              {line.quantity}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={isBusy}
              onClick={onIncrement}
              aria-label={`Augmenter la quantité de ${line.name}`}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        <span
          className={cn(
            "w-24 text-right text-sm tabular-nums",
            isCancelled && "line-through text-muted-foreground",
          )}
        >
          {formatCurrency(line.price * line.quantity)}
        </span>

        {isDraft && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive"
            disabled={isBusy}
            onClick={onRemove}
            aria-label={`Retirer ${line.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}

        {!isDraft && !isCancelled && canVoid && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive"
            disabled={isBusy}
            onClick={onVoid}
            aria-label={`Annuler ${line.name}`}
          >
            <Ban className="h-4 w-4" />
          </Button>
        )}
      </div>
    </li>
  );
}

/**
 * Lignes d'un ticket, séparées en deux blocs qui ne se traitent pas pareil :
 * ce qui n'est pas encore parti se corrige librement, ce qui est parti ne
 * s'annule qu'avec un motif.
 */
export function TicketLines({
  lines,
  formatCurrency,
  canVoid,
  isBusy,
  onIncrement,
  onDecrement,
  onRemove,
  onVoid,
}: {
  lines: OrderItem[];
  formatCurrency: (amount: number) => string;
  canVoid: boolean;
  isBusy?: boolean;
  onIncrement: (line: OrderItem) => void;
  onDecrement: (line: OrderItem) => void;
  onRemove: (line: OrderItem) => void;
  onVoid: (line: OrderItem) => void;
}) {
  const drafts = lines.filter((l) => l.status === "draft");
  const sent = lines.filter((l) => l.status !== "draft");
  const rounds = groupByRound(sent);

  return (
    <div className="space-y-5">
      {drafts.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-amber-700">
            En attente d&apos;envoi ({drafts.length})
          </h3>
          <ul className="space-y-2">
            {drafts.map((line) => (
              <LineRow
                key={line.id}
                line={line}
                formatCurrency={formatCurrency}
                canVoid={canVoid}
                isBusy={isBusy}
                onIncrement={() => onIncrement(line)}
                onDecrement={() => onDecrement(line)}
                onRemove={() => onRemove(line)}
                onVoid={() => onVoid(line)}
              />
            ))}
          </ul>
        </section>
      )}

      {rounds.map((round, index) => (
        <section key={round.sentAt} className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            Tournée {index + 1}
            {round.sentAt !== "—" && (
              <span className="font-normal">
                · envoyée{" "}
                {safeFormatDistanceToNow(round.sentAt, {
                  addSuffix: true,
                  locale: fr,
                })}
              </span>
            )}
          </h3>
          <ul className="space-y-2">
            {round.lines.map((line) => (
              <LineRow
                key={line.id}
                line={line}
                formatCurrency={formatCurrency}
                canVoid={canVoid}
                isBusy={isBusy}
                onVoid={() => onVoid(line)}
              />
            ))}
          </ul>
        </section>
      ))}

      {lines.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Ce ticket est vide. Ajoutez un premier article.
        </p>
      )}
    </div>
  );
}

export default TicketLines;
