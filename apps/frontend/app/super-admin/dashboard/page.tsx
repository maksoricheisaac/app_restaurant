"use client";

import {
  Store,
  Users,
  CreditCard,
  Clock,
  Plus,
  AlertCircle,
  Loader2,
  Activity,
  ShoppingBag,
  BarChart2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/ui/stats-card";
import { usePlatformStats } from "@/hooks/api/useDashboard";
import { fr } from "date-fns/locale";
import { safeFormat } from "@/lib/utils";
import Link from "next/link";

export default function SuperAdminDashboard() {
  const { data: statsData, isLoading } = usePlatformStats();

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Vue d&apos;ensemble</h2>
          <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-500" />
            La plateforme fonctionne normalement.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="gap-2 shadow-sm shadow-primary/20" asChild>
            <Link href="/super-admin/tenants">
              <Plus className="h-4 w-4" />
              Nouveau Restaurant
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards — données réelles via /dashboard/platform-stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Restaurants"
          value={statsData?.totalTenants ?? 0}
          icon={<Store className="h-5 w-5" />}
          variant="blue"
          subtitle={`${statsData?.activeTenants ?? 0} établissements actifs`}
        />
        <StatsCard
          title="Utilisateurs"
          value={statsData?.totalUsers ?? 0}
          icon={<Users className="h-5 w-5" />}
          variant="purple"
          subtitle="Inscrits sur la plateforme"
        />
        <StatsCard
          title="Revenu Total"
          value={new Intl.NumberFormat("fr-FR", {
            style: "currency",
            currency: "EUR",
          }).format(statsData?.totalRevenue ?? 0)}
          icon={<CreditCard className="h-5 w-5" />}
          variant="green"
        />
        <StatsCard
          title="Commandes"
          value={statsData?.totalOrders ?? 0}
          icon={<ShoppingBag className="h-5 w-5" />}
          variant="orange"
          subtitle="Toutes périodes confondues"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Graphique — pas encore de données analytiques en temps réel */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-primary" />
              Croissance de la Plateforme
            </CardTitle>
            <CardDescription>
              Évolution mensuelle des inscriptions et du revenu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-[260px] gap-3 rounded-xl border-2 border-dashed border-border text-center px-6">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <BarChart2 className="h-6 w-6 text-muted-foreground/40" />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">Analytiques bientôt disponibles</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Les graphiques d&apos;évolution seront affichés ici une fois l&apos;endpoint
                  <span className="font-mono mx-1">/dashboard/growth</span>
                  disponible côté API.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Restaurants Récents — données réelles */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Inscriptions Récentes</CardTitle>
              <CardDescription>Les derniers restaurants enregistrés</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary font-semibold hover:bg-primary/10"
              asChild
            >
              <Link href="/super-admin/tenants">Voir tout</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statsData?.recentTenants?.map((tenant: any) => (
                <div
                  key={tenant.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center font-bold text-muted-foreground text-sm uppercase">
                      {tenant.name?.substring(0, 2)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{tenant.name}</div>
                      <div className="text-xs text-muted-foreground">@{tenant.slug}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        tenant.plan === "enterprise" ? "default"
                        : tenant.plan === "pro" ? "secondary"
                        : "outline"
                      }
                      className="text-[10px] uppercase font-bold tracking-tighter mb-1"
                    >
                      {tenant.plan ?? "free"}
                    </Badge>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
                      <Clock className="h-3 w-3" />
                      {safeFormat(tenant.createdAt, "dd MMM yyyy", { locale: fr })}
                    </div>
                  </div>
                </div>
              ))}

              {(!statsData?.recentTenants || statsData.recentTenants.length === 0) && (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                  <AlertCircle className="h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground italic">
                    Aucun restaurant inscrit pour le moment.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
