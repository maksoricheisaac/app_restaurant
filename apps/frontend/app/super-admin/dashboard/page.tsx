"use client";

import {
  Store,
  Users,
  CreditCard,
  Clock,
  Plus,
  TrendingUp,
  AlertCircle,
  Loader2,
  Activity,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/ui/stats-card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { usePlatformStats } from "@/hooks/api/useDashboard";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const data = [
  { name: "Jan", restaurants: 4, revenue: 400 },
  { name: "Fév", restaurants: 7, revenue: 700 },
  { name: "Mar", restaurants: 12, revenue: 1200 },
  { name: "Avr", restaurants: 18, revenue: 1800 },
  { name: "Mai", restaurants: 25, revenue: 2500 },
  { name: "Juin", restaurants: 32, revenue: 3200 },
];

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
          <h2 className="text-2xl font-bold tracking-tight">Vue d'ensemble</h2>
          <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-500" />
            La plateforme fonctionne normalement.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Sparkles className="h-4 w-4 text-orange-500" />
            Voir Insights
          </Button>
          <Button size="sm" className="gap-2 shadow-sm shadow-primary/20">
            <Plus className="h-4 w-4" />
            Nouveau Restaurant
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
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
          trend={{ value: 18, label: "ce mois" }}
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
        {/* Graphique de croissance */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Croissance de la Plateforme
            </CardTitle>
            <CardDescription>
              Évolution au cours des 6 derniers mois (Données démo)
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                />
                <Bar
                  dataKey="restaurants"
                  fill="var(--primary)"
                  radius={[4, 4, 0, 0]}
                  barSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Restaurants Récents */}
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
              <a href="/super-admin/tenants">Voir tout</a>
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
                      {tenant.name.substring(0, 2)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{tenant.name}</div>
                      <div className="text-xs text-muted-foreground">
                        @{tenant.slug}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        tenant.plan === "Enterprise"
                          ? "default"
                          : tenant.plan === "Pro"
                          ? "secondary"
                          : "outline"
                      }
                      className="text-[10px] uppercase font-bold tracking-tighter mb-1"
                    >
                      {tenant.plan}
                    </Badge>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
                      <Clock className="h-3 w-3" />
                      {format(new Date(tenant.createdAt), "dd MMM yyyy", {
                        locale: fr,
                      })}
                    </div>
                  </div>
                </div>
              ))}
              {(!statsData?.recentTenants ||
                statsData.recentTenants.length === 0) && (
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
