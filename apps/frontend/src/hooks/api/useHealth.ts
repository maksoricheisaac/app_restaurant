import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api-client';

export interface HealthCheck {
  status: 'ok' | 'degraded';
  uptime: number;
  timestamp: string;
  checks: {
    database: { status: 'ok' | 'error'; latencyMs: number | null };
    redis: { status: 'ok' | 'error' | 'not_configured'; latencyMs: number | null };
    memory: { status: 'ok' | 'warn'; heapUsedMb: number; heapTotalMb: number; rssMb: number };
    process: { status: 'ok'; pid: number; nodeVersion: string; env: string };
  };
}

/** Santé plateforme en temps réel (endpoint public /health). */
export const useHealth = () =>
  useQuery<HealthCheck>({
    queryKey: ['platform-health'],
    queryFn: () => api.get('/health'),
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
