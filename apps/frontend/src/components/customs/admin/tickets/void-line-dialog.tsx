"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { OrderItem } from "@/types/order";

/** Motifs courants, pour éviter que le champ libre reste vide ou bâclé. */
const COMMON_REASONS = [
  "Erreur de saisie",
  "Plat renvoyé par le client",
  "Rupture en cuisine",
  "Geste commercial",
];

/**
 * Annulation d'une ligne déjà partie en cuisine.
 *
 * Le motif est exigé côté serveur : une annulation après envoi est une perte
 * — de marchandise, de travail ou de chiffre d'affaires — et le stock est
 * restitué à cette occasion. Cet écran ne fait que rendre l'exigence lisible.
 */
export function VoidLineDialog({
  line,
  isOpen,
  onClose,
  onConfirm,
  isPending,
}: {
  line: OrderItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isPending?: boolean;
}) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (isOpen) setReason("");
  }, [isOpen, line?.id]);

  if (!line) return null;

  const trimmed = reason.trim();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Annuler « {line.name} »</DialogTitle>
          <DialogDescription>
            Cette ligne est partie en cuisine. Elle restera sur le ticket,
            barrée, et son stock sera restitué.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {COMMON_REASONS.map((preset) => (
              <Button
                key={preset}
                type="button"
                variant={reason === preset ? "default" : "outline"}
                size="sm"
                onClick={() => setReason(preset)}
              >
                {preset}
              </Button>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="void-reason">Motif</Label>
            <Textarea
              id="void-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Précisez la raison de l'annulation"
              rows={3}
              maxLength={255}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Retour
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!trimmed || isPending}
            onClick={() => onConfirm(trimmed)}
          >
            {isPending ? "Annulation…" : "Annuler la ligne"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default VoidLineDialog;
