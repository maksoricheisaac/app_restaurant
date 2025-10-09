"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LoadingState } from '@/components/ui/loading-state';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { Permission } from '@/types/permissions';

import {
  HeaderSection,
  KeyMetrics,
  SalesReport,
  RevenueChart,
  ExportButtons,
} from '@/components/customs/admin/reports';

import { calculateMetrics, getChartData } from '@/actions/admin/report-actions';

const fetchMetrics = async (type: string, date?: string) => {
  const result = await calculateMetrics({ type: type as 'daily' | 'weekly' | 'monthly' | 'yearly', date });
  if (!result.data) throw new Error('Erreur lors du calcul des métriques');
  return result.data;
};

const fetchChartData = async (type: string, date?: string) => {
  const result = await getChartData({ type: type as 'daily' | 'weekly' | 'monthly' | 'yearly', date });
  if (!result.data) throw new Error('Erreur lors de la récupération des données graphiques');
  return result.data;
};

export default function AdminReports() {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);

  // Query pour les métriques
  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: ['metrics', selectedPeriod, selectedDate],
    queryFn: () => fetchMetrics(selectedPeriod, selectedDate),
  });

  // Query pour les données du graphique
  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['chartData', selectedPeriod, selectedDate],
    queryFn: () => fetchChartData(selectedPeriod, selectedDate),
  });

  const isLoading = metricsLoading || chartLoading;

  const formatPrice = (price: number | undefined) => {
    if (price === undefined || price === null) return '0 FCFA';
    return `${price.toLocaleString()} FCFA`;
  };

  if (isLoading) {
    return <LoadingState message="Chargement des rapports..." fullScreen />;
  }

  // Utiliser les métriques calculées - accéder à data.data
  const currentMetrics = metricsData?.data || {
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
            data={chartData?.data || []}
            period={selectedPeriod}
          />
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Actions</h3>
              <ExportButtons
                data={currentMetrics}
                chartData={chartData?.data || []}
                formatPrice={formatPrice}
              />
            </div>
            <SalesReport
              topDishes={currentMetrics.topDishes || []}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}