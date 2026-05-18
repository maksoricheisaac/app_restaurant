import { useQuery } from "@tanstack/react-query";
import { reportsService } from "@/services/reports.service";

export const useReportMetrics = (params: { type: 'daily' | 'weekly' | 'monthly' | 'yearly'; date?: string }) => {
  return useQuery({
    queryKey: ['report-metrics', params],
    queryFn: () => reportsService.getMetrics(params),
  });
};

export const useReportChartData = (params: { type: 'daily' | 'weekly' | 'monthly' | 'yearly'; date?: string }) => {
  return useQuery({
    queryKey: ['report-chart-data', params],
    queryFn: () => reportsService.getChartData(params),
  });
};
