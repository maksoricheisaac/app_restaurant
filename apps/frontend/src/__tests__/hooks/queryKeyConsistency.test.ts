import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { queryKeys } from '@/lib/query-keys';

/**
 * Ces tests couvrent exactement le bug trouvé par l'audit : la clé de
 * cache réellement utilisée par un `useQuery` (le "producteur") doit être
 * strictement identique à celle utilisée par les invalidations de
 * mutation / temps réel (le "consommateur", voir useRealtimeInvalidation
 * et useOrdersMutations). Une divergence entre les deux — comme
 * `['kitchen-orders']` vs `queryKeys.orders.kitchen()` — fait que
 * l'invalidation ne trouve jamais l'entrée de cache à rafraîchir.
 *
 * On capture ici le `queryKey` réellement passé à `useQuery` par chaque
 * hook producteur et on l'assert égal à la factory centralisée.
 */

let capturedKey: readonly unknown[] | undefined;

vi.mock('@tanstack/react-query', () => ({
  useQuery: (opts: { queryKey: readonly unknown[] }) => {
    capturedKey = opts.queryKey;
    return { data: undefined, isLoading: false, isError: false };
  },
}));

vi.mock('@/services/orders.service', () => ({
  ordersService: {
    getOrders: vi.fn(),
    getOrderById: vi.fn(),
    getKitchenOrders: vi.fn(),
  },
}));

vi.mock('@/services/dashboard.service', () => ({
  dashboardService: {
    getStats: vi.fn(),
    getLatestOrders: vi.fn(),
  },
}));

import { useOrders, useOrder, useKitchenOrders } from '@/hooks/api/useOrders';
import {
  useDashboardStats,
  useLatestOrders,
} from '@/hooks/api/useDashboard';

describe('Query key consistency — producer hooks vs queryKeys factory', () => {
  beforeEach(() => {
    capturedKey = undefined;
  });

  it('useOrders uses queryKeys.orders.list(filters)', () => {
    renderHook(() => useOrders({ status: 'pending' }));
    expect(capturedKey).toEqual(queryKeys.orders.list({ status: 'pending' }));
  });

  it('useOrder uses queryKeys.orders.detail(id) — matches orderStatusUpdate() invalidation', () => {
    renderHook(() => useOrder('order-42'));
    expect(capturedKey).toEqual(queryKeys.orders.detail('order-42'));
  });

  it('useKitchenOrders uses queryKeys.orders.kitchen() — the exact key that regressed', () => {
    renderHook(() => useKitchenOrders());
    expect(capturedKey).toEqual(queryKeys.orders.kitchen());
    expect(capturedKey).toEqual(['orders', 'kitchen']);
  });

  it('useDashboardStats uses queryKeys.dashboard.stats(params)', () => {
    renderHook(() => useDashboardStats({ date: '2026-07-09' }));
    expect(capturedKey).toEqual(
      queryKeys.dashboard.stats({ date: '2026-07-09' }),
    );
  });

  it('useLatestOrders uses queryKeys.dashboard.latestOrders(params)', () => {
    renderHook(() => useLatestOrders({ page: 1 }));
    expect(capturedKey).toEqual(queryKeys.dashboard.latestOrders({ page: 1 }));
  });

});
