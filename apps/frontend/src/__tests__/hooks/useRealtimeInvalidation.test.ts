import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRealtimeInvalidation } from '@/hooks/useRealtimeInvalidation';
import { queryKeys } from '@/lib/query-keys';

// Mocks
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: vi.fn(),
}));

vi.mock('@/hooks/useSocketEvent', () => ({
  useSocketEvent: vi.fn(),
}));

import { useQueryClient } from '@tanstack/react-query';
import { useSocketEvent } from '@/hooks/useSocketEvent';

describe('useRealtimeInvalidation', () => {
  const mockInvalidate = vi.fn();
  const capturedHandlers: Record<string, (data: unknown) => void> = {};

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useQueryClient).mockReturnValue({
      invalidateQueries: mockInvalidate,
    } as any);

    // Capture les callbacks enregistrés
    vi.mocked(useSocketEvent).mockImplementation((event, callback) => {
      capturedHandlers[event] = callback as (data: unknown) => void;
    });
  });

  it('registers handlers for new-order, order-status-updated, new-reservation, new-message', () => {
    renderHook(() => useRealtimeInvalidation());

    expect(vi.mocked(useSocketEvent)).toHaveBeenCalledWith('new-order', expect.any(Function));
    expect(vi.mocked(useSocketEvent)).toHaveBeenCalledWith('order-status-updated', expect.any(Function));
    expect(vi.mocked(useSocketEvent)).toHaveBeenCalledWith('new-reservation', expect.any(Function));
    expect(vi.mocked(useSocketEvent)).toHaveBeenCalledWith('new-message', expect.any(Function));
  });

  it('new-order invalidates orders, kitchen, and dashboard queries', () => {
    renderHook(() => useRealtimeInvalidation());

    capturedHandlers['new-order']?.({});

    expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: queryKeys.orders.all() });
    expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: queryKeys.orders.kitchen() });
    expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: queryKeys.dashboard.stats() });
  });

  it('order-status-updated with id invalidates specific order', () => {
    renderHook(() => useRealtimeInvalidation());

    capturedHandlers['order-status-updated']?.({ id: 'order-123', status: 'ready' });

    expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: queryKeys.orders.detail('order-123') });
  });

  it('new-reservation invalidates reservations and dashboard', () => {
    renderHook(() => useRealtimeInvalidation());

    capturedHandlers['new-reservation']?.({});

    expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: queryKeys.reservations.all() });
    expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: queryKeys.dashboard.stats() });
  });

  it('new-message invalidates messages', () => {
    renderHook(() => useRealtimeInvalidation());

    capturedHandlers['new-message']?.({});

    expect(mockInvalidate).toHaveBeenCalledWith({ queryKey: queryKeys.messages.all() });
  });
});
