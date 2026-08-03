"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { LoadingState } from '@/components/ui/loading-state';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { Permission } from '@/types/permissions';

import {
  HeaderSection,
  KeyMetrics,
  SalesReport,
  ExportButtons,
} from '@/components/customs/admin/reports';
import type { ReportMetrics } from '@/components/customs/admin/reports/key-metrics';
import {
  useReportMetrics,
  useReportChartData,
} from '@/hooks/api/useReports';

// chart.js/react-chartjs-2 ne sont utiles que sur cette page et
// n'ont pas besoin d'être dans le bundle initial de l'admin — chargé à la
// demande, seulement quand la page rapports est réellement visitée.
const RevenueChart = dynamic(
  () => import('@/components/customs/admin/reports/revenue-chart').then((m) => m.RevenueChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full animate-pulse rounded-xl bg-muted" />
    ),
  },
);

export default function AdminReports() {
  const [selectedPeriod, setSelectedPeriod] = useState<any>('monthly');
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);

  // Query pour les métriques
  const { data: metricsData, isLoading: metricsLoading } = useReportMetrics({
    type: selectedPeriod,
    date: selectedDate,
  });

  // Query pour les données du graphique
  const { data: chartData, isLoading: chartLoading } = useReportChartData({
    type: selectedPeriod,
    date: selectedDate,
  });

  const isLoading = metricsLoading || chartLoading;

  const formatPrice = (price: number | undefined) => {
    if (price === undefined || price === null) return '0 FCFA';
    return `${price.toLocaleString()} FCFA`;
  };

  if (isLoading) {
    return <LoadingState message="Chargement des rapports..." fullScreen />;
  }

  // Repli aligné sur le contrat réel de /reports/metrics : des objets, pas
  // des nombres. Le repli précédent inventait une forme que l'API n'a jamais
  // renvoyée, ce qui masquait le désaccord jusqu'au rendu.
  const currentMetrics: ReportMetrics = metricsData ?? {
    orders: { total: 0, byStatus: {} },
    revenue: {
      collected: 0,
      ordered: 0,
      outstanding: 0,
      paidOrderCount: 0,
      averageTicket: 0,
    },
    customers: { new: 0 },
    reservations: { total: 0 },
    period: {
      start: new Date(),
      end: new Date(),
      type: selectedPeriod,
    },
  };

  // Les exports attendent une forme à plat. L'adaptation est explicite ici
  // plutôt que dilée dans le générateur : le CSV et le PDF disent « chiffre
  // d'affaires encaissé » parce que c'est bien ce montant-là qui leur est
  // transmis.
  const exportData = {
    revenue: currentMetrics.revenue.collected,
    orders: currentMetrics.orders.total,
    customers: currentMetrics.customers.new,
    avgOrder: currentMetrics.revenue.averageTicket,
    topDishes: [],
    period: {
      start: new Date(currentMetrics.period.start),
      end: new Date(currentMetrics.period.end),
      type: currentMetrics.period.type,
    },
  };

  return (
    <ProtectedRoute requiredPermission={Permission.VIEW_REPORTS}>
      <div className="space-y-4 md:space-y-8 w-full">
        <HeaderSection
          selectedPeriod={selectedPeriod}
          setSelectedPeriod={setSelectedPeriod}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />

        <KeyMetrics
          latestReport={currentMetrics}
          formatPrice={formatPrice}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RevenueChart
            data={chartData || []}
            period={selectedPeriod}
          />
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Actions</h3>
              <ExportButtons
                data={exportData}
                chartData={chartData || []}
                formatPrice={formatPrice}
              />
            </div>
            {/* Le palmarès des ventes n'est pas encore calculé côté serveur —
                la carte affiche son état vide tant que la brique « top
                ventes » du reporting n'existe pas. */}
            <SalesReport topDishes={[]} />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}