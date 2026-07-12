"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { LoadingState } from '@/components/ui/loading-state';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { Permission } from '@/types/permissions';
import { FeatureGate } from '@/components/ui/feature-gate';

import {
  HeaderSection,
  KeyMetrics,
  SalesReport,
  ExportButtons,
} from '@/components/customs/admin/reports';
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

  // Utiliser les métriques calculées
  const currentMetrics = metricsData || {
    revenue: 0,
    orders: 0,
    customers: 0,
    avgOrder: 0,
    topDishes: [],
    period: {
      start: new Date(),
      end: new Date(),
      type: 'monthly'
    }
  };

  return (
    <ProtectedRoute requiredPermission={Permission.VIEW_REPORTS}>
      <FeatureGate feature="advancedReports" featureName="Les rapports avancés" className="rounded-xl">
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
                data={currentMetrics}
                chartData={chartData || []}
                formatPrice={formatPrice}
              />
            </div>
            <SalesReport
              topDishes={currentMetrics.topDishes || []}
            />
          </div>
        </div>
      </div>
      </FeatureGate>
    </ProtectedRoute>
  );
}