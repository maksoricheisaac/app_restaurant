"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Lock, Unlock, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCurrentCashSession } from "@/hooks/api/useCashRegister";
import { useOpenCashSession, useCloseCashSession } from "@/hooks/api/useCashRegisterMutations";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XAF" }).format(amount);
}

export function CashSessionCard() {
  const { data: session, isLoading } = useCurrentCashSession();
  const openSession = useOpenCashSession();
  const closeSession = useCloseCashSession();

  const [openDialogOpen, setOpenDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [openingAmount, setOpeningAmount] = useState("");
  const [closingAmount, setClosingAmount] = useState("");

  const isOpen = !isLoading && !!session;

  const handleOpen = () => {
    const amount = Number(openingAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error("Montant de fond de caisse invalide");
      return;
    }
    openSession.mutate(
      { openingAmount: amount },
      {
        onSuccess: () => {
          toast.success("Session de caisse ouverte");
          setOpenDialogOpen(false);
          setOpeningAmount("");
        },
      },
    );
  };

  const handleClose = () => {
    const amount = Number(closingAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error("Montant compté invalide");
      return;
    }
    closeSession.mutate(
      { closingAmount: amount },
      {
        onSuccess: (result: any) => {
          const variance = Number(result?.variance ?? 0);
          if (variance === 0) {
            toast.success("Session clôturée — caisse exacte");
          } else if (variance > 0) {
            toast.success(`Session clôturée — surplus de ${formatCurrency(variance)}`);
          } else {
            toast.warning(`Session clôturée — manque de ${formatCurrency(Math.abs(variance))}`);
          }
          setCloseDialogOpen(false);
          setClosingAmount("");
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Session de caisse
          </span>
          {!isLoading && (
            <Badge variant={isOpen ? "default" : "secondary"}>
              {isOpen ? "Ouverte" : "Fermée"}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {isOpen ? (
          <>
            <div className="text-sm text-muted-foreground">
              Ouverte par <span className="font-medium text-foreground">{session?.openedByUser?.name ?? "—"}</span> avec un fond de{" "}
              <span className="font-medium text-foreground">{formatCurrency(Number(session?.openingAmount ?? 0))}</span>
            </div>
            <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-2">
                  <Lock className="w-4 h-4" />
                  Clôturer la caisse
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Clôturer la session de caisse</DialogTitle>
                  <DialogDescription>
                    Comptez les espèces présentes dans le tiroir et saisissez le montant. L&apos;écart avec le montant attendu sera calculé automatiquement.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-2">
                  <Label htmlFor="closing-amount">Montant compté (espèces)</Label>
                  <Input
                    id="closing-amount"
                    type="number"
                    min={0}
                    step="0.01"
                    value={closingAmount}
                    onChange={(e) => setClosingAmount(e.target.value)}
                    placeholder="0"
                    autoFocus
                  />
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleClose}
                    disabled={closeSession.isPending}
                  >
                    {closeSession.isPending ? "Clôture..." : "Confirmer la clôture"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        ) : (
          <>
            <div className="text-sm text-muted-foreground">
              Aucune session ouverte — ouvrez la caisse avant d&apos;encaisser un paiement.
            </div>
            <Dialog open={openDialogOpen} onOpenChange={setOpenDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Unlock className="w-4 h-4" />
                  Ouvrir la caisse
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ouvrir une session de caisse</DialogTitle>
                  <DialogDescription>
                    Indiquez le fond de caisse initial (espèces) présent dans le tiroir.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-2">
                  <Label htmlFor="opening-amount">Fond de caisse initial</Label>
                  <Input
                    id="opening-amount"
                    type="number"
                    min={0}
                    step="0.01"
                    value={openingAmount}
                    onChange={(e) => setOpeningAmount(e.target.value)}
                    placeholder="0"
                    autoFocus
                  />
                </div>
                <DialogFooter>
                  <Button onClick={handleOpen} disabled={openSession.isPending}>
                    {openSession.isPending ? "Ouverture..." : "Ouvrir la session"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </CardContent>
    </Card>
  );
}
