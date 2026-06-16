import { describe, it, expect } from 'vitest';
import { queryKeys, INVALIDATION_GROUPS } from '@/lib/query-keys';

describe('queryKeys — factory functions', () => {
  it('orders.all() returns stable key', () => {
    expect(queryKeys.orders.all()).toEqual(['orders']);
    // Stable across calls
    expect(queryKeys.orders.all()).toEqual(queryKeys.orders.all());
  });

  it('orders.list with filters is scoped', () => {
    const key = queryKeys.orders.list({ status: 'pending' });
    expect(key[0]).toBe('orders');
    expect(key[2]).toEqual({ status: 'pending' });
  });

  it('orders.detail includes id', () => {
    const key = queryKeys.orders.detail('order-123');
    expect(key).toContain('order-123');
  });

  it('orders.kitchen returns dedicated key', () => {
    expect(queryKeys.orders.kitchen()).toEqual(['orders', 'kitchen']);
  });

  it('invalidation prefix match — orders.all() prefixes orders.kitchen()', () => {
    const allKey = queryKeys.orders.all();
    const kitchenKey = queryKeys.orders.kitchen();
    // TanStack Query matches by prefix — all() should cover kitchen() when invalidating
    expect(kitchenKey[0]).toBe(allKey[0]);
  });
});

describe('INVALIDATION_GROUPS', () => {
  it('newOrder group includes kitchen key', () => {
    const haKitchen = INVALIDATION_GROUPS.newOrder.some(
      k => JSON.stringify(k) === JSON.stringify(queryKeys.orders.kitchen()),
    );
    expect(haKitchen).toBe(true);
  });

  it('orderStatusUpdate returns array with detail key', () => {
    const keys = INVALIDATION_GROUPS.orderStatusUpdate('my-order');
    const hasDetail = keys.some(
      k => JSON.stringify(k) === JSON.stringify(queryKeys.orders.detail('my-order')),
    );
    expect(hasDetail).toBe(true);
  });

  it('newReservation includes reservations key', () => {
    const hasReservations = INVALIDATION_GROUPS.newReservation.some(
      k => JSON.stringify(k) === JSON.stringify(queryKeys.reservations.all()),
    );
    expect(hasReservations).toBe(true);
  });
});
