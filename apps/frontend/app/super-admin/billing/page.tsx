'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreditCard, Receipt, TrendingUp, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SuperAdminBillingPage() {
  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Facturation & Abonnements</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Suivez les revenus et gérez les abonnements des restaurants.
          </p>
        </div>
        <Button size="sm" className="gap-2" disabled>
          <Download className="h-4 w-4" />
          Exporter Rapport
        </Button>
      </div>

      {/* Placeholder facturation */}
      <div className="rounded-2xl border-2 border-dashed border-border bg-muted/30 px-8 py-14 flex flex-col items-center justify-center text-center gap-4">
        <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
          <CreditCard className="h-7 w-7 text-muted-foreground/40" />
        </div>
        <div>
          <p className="font-semibold text-foreground text-base">Tableau de bord facturation</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Les métriques de facturation (MRR, abonnements actifs, transactions) seront
            disponibles après connexion à l'API Lemon Squeezy.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-6 pt-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span>MRR & ARR</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            <span>Abonnements actifs</span>
          </div>
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            <span>Historique des paiements</span>
          </div>
        </div>
      </div>
    </div>
  );
}
