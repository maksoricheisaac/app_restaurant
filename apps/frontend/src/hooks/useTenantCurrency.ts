'use client';

import { useCallback } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { formatCurrency as _format } from '@/lib/order-utils';

/**
 * Returns a formatCurrency function pre-bound to the current tenant's currency.
 * Falls back to EUR when no tenant is loaded.
 *
 * Usage:
 *   const formatCurrency = useTenantCurrency();
 *   formatCurrency(1500) // "1 500 FCFA" for XAF tenant, "1 500,00 €" for EUR tenant
 */
export function useTenantCurrency(): (amount: number) => string {
  const { tenant } = useTenant();
  const currency = tenant?.currency ?? 'EUR';
  return useCallback((amount: number) => _format(amount, currency), [currency]);
}
