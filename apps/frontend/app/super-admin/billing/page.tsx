'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreditCard, Receipt, TrendingUp, Download, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/ui/stats-card";

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
        <Button size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Exporter Rapport
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="MRR (Revenu Mensuel)"
          value="12 450 €"
          icon={<TrendingUp className="h-5 w-5" />}
          variant="green"
          trend={{ value: 8, label: "ce mois" }}
        />
        <StatsCard
          title="Abonnements Actifs"
          value={156}
          icon={<CreditCard className="h-5 w-5" />}
          variant="blue"
          subtitle="92% de rétention"
        />
        <StatsCard
          title="Factures Impayées"
          value={3}
          icon={<Receipt className="h-5 w-5" />}
          variant="rose"
          subtitle="Action requise"
        />
      </div>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions Récentes</CardTitle>
          <CardDescription>Historique des derniers paiements reçus.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-48 gap-3 rounded-lg border-2 border-dashed border-border">
            <AlertCircle className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              L'historique des transactions sera bientôt disponible.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
