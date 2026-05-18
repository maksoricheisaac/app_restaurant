import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  queryTime: number;
  dataSize: number;
  timestamp: number;
}

interface PerformanceMonitorProps {
  queryKey: string;
  isLoading: boolean;
  data: unknown;
  onMetrics?: (metrics: PerformanceMetrics) => void;
}

export function PerformanceMonitor({ 
  queryKey, 
  isLoading, 
  data, 
  onMetrics 
}: PerformanceMonitorProps) {
  const [startTime, setStartTime] = useState<number | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    if (isLoading && !startTime) {
      setStartTime(performance.now());
    } else if (!isLoading && startTime && data !== null && data !== undefined) {
      const endTime = performance.now();
      const queryTime = endTime - startTime;
      const dataSize = JSON.stringify(data).length;
      
      const newMetrics: PerformanceMetrics = {
        queryTime,
        dataSize,
        timestamp: Date.now(),
      };

      setMetrics(newMetrics);
      setStartTime(null);
      
      if (onMetrics) {
        onMetrics(newMetrics);
      }

      // Log en mode développement
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔍 Performance - ${queryKey}:`, {
          queryTime: `${queryTime.toFixed(2)}ms`,
          dataSize: `${(dataSize / 1024).toFixed(2)}KB`,
          itemCount: Array.isArray(data) ? data.length : 'N/A'
        });
      }
    }
  }, [isLoading, data, startTime, queryKey, onMetrics]);

  // Affichage en mode développement uniquement
  if (process.env.NODE_ENV !== 'development' || !metrics) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-2 rounded text-xs z-50">
      <div>Query: {queryKey}</div>
      <div>Time: {metrics.queryTime.toFixed(2)}ms</div>
      <div>Size: {(metrics.dataSize / 1024).toFixed(2)}KB</div>
    </div>
  );
}

// Hook pour mesurer les performances
export function usePerformanceMonitor(queryKey: string, isLoading: boolean, data: unknown) {
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceMetrics[]>([]);

  const handleMetrics = (metrics: PerformanceMetrics) => {
    setPerformanceHistory(prev => [...prev.slice(-9), metrics]); // Garder les 10 dernières mesures
  };

  return {
    PerformanceMonitor: () => (
      <PerformanceMonitor
        queryKey={queryKey}
        isLoading={isLoading}
        data={data}
        onMetrics={handleMetrics}
      />
    ),
    performanceHistory,
    averageQueryTime: performanceHistory.length > 0 
      ? performanceHistory.reduce((sum, m) => sum + m.queryTime, 0) / performanceHistory.length
      : 0,
  };
} 