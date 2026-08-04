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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OrderType } from "@/types/order";

type Table = { id: string; number: number; seats: number };

/**
 * Ouverture d'un ticket vide.
 *
 * Aucun article n'est saisi ici : le ticket naît ouvert, et se remplit
 * ensuite au fil du service. C'est ce que rendait impossible l'ancien
 * formulaire, qui exigeait la commande complète dès la création.
 */
export function NewTicketDialog({
  isOpen,
  onClose,
  tables,
  occupiedTableIds,
  onConfirm,
  isPending,
}: {
  isOpen: boolean;
  onClose: () => void;
  tables: Table[];
  occupiedTableIds: string[];
  onConfirm: (input: { type: OrderType; tableId?: string }) => void;
  isPending?: boolean;
}) {
  const [type, setType] = useState<OrderType>("dine_in");
  const [tableId, setTableId] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setType("dine_in");
      setTableId("");
    }
  }, [isOpen]);

  const needsTable = type === "dine_in";
  const canConfirm = !needsTable || tableId !== "";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ouvrir un ticket</DialogTitle>
          <DialogDescription>
            Le ticket reste ouvert pendant tout le service : vous y ajouterez
            les articles au fur et à mesure.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ticket-type">Type de service</Label>
            <Select
              value={type}
              onValueChange={(value) => setType(value as OrderType)}
            >
              <SelectTrigger id="ticket-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dine_in">Sur place</SelectItem>
                <SelectItem value="takeaway">À emporter</SelectItem>
                <SelectItem value="delivery">Livraison</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {needsTable && (
            <div className="space-y-1.5">
              <Label htmlFor="ticket-table">Table</Label>
              <Select value={tableId} onValueChange={setTableId}>
                <SelectTrigger id="ticket-table" className="w-full">
                  <SelectValue placeholder="Choisir une table" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map((table) => {
                    const occupied = occupiedTableIds.includes(table.id);
                    return (
                      <SelectItem key={table.id} value={table.id}>
                        Table {table.number} · {table.seats} places
                        {occupied ? " — ticket déjà ouvert" : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {tableId && occupiedTableIds.includes(tableId) && (
                <p className="text-xs text-amber-700">
                  Cette table a déjà un ticket ouvert. Vous en créerez un
                  second.
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            type="button"
            disabled={!canConfirm || isPending}
            onClick={() =>
              onConfirm({ type, tableId: needsTable ? tableId : undefined })
            }
          >
            {isPending ? "Ouverture…" : "Ouvrir le ticket"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default NewTicketDialog;
