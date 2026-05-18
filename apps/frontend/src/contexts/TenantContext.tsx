'use client';

import { createContext, useContext, useEffect, useState, useMemo, ReactNode, useCallback } from 'react';
import { tenantsService } from '@/services/tenants.service';
import { Tenant } from '@/types/tenant';
import { useAuth } from './AuthContext';

interface TenantContextType {
  tenant: Tenant | null;
  isLoading: boolean;
  error: string | null;
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  isLoading: true,
  error: null,
});

export const useTenant = () => useContext(TenantContext);

interface ResolveResult {
  slug?: string;
  id?: string;
}

function resolveContext(): ResolveResult {
  if (typeof window === 'undefined') return {};
  const host = window.location.host;
  const parts = host.split('.');
  if (parts.length > 2 && parts[0] !== 'www') return { slug: parts[0] };
  const slug = localStorage.getItem('tenantSlug');
  if (slug) return { slug };
  const id = localStorage.getItem('tenantId');
  if (id) return { id };
  return {};
}

function persistTenant(tenant: Tenant) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('tenantSlug', tenant.slug);
  localStorage.setItem('tenantId', tenant.id);
  // Set httpOnly cookies via API route — document.cookie cannot set httpOnly flags
  void fetch('/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenantId: tenant.id, tenantSlug: tenant.slug }),
  });
}

export const TenantProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedId, setResolvedId] = useState<string | null>(null);

  const fetchTenant = useCallback(async (ctx: ResolveResult) => {
    if (!ctx.slug && !ctx.id) {
      setTenant(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      let tenantData: Tenant | null = null;
      if (ctx.slug) {
        tenantData = await tenantsService.resolveTenantBySlug(ctx.slug);
      } else if (ctx.id) {
        tenantData = await tenantsService.getTenantById(ctx.id);
      }

      if (tenantData) {
        setTenant(tenantData);
        setResolvedId(tenantData.id);
        persistTenant(tenantData);
      } else {
        setTenant(null);
        setError('Restaurant introuvable ou inactif');
      }
    } catch {
      setError('Impossible de charger les données du restaurant');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial resolution from localStorage / subdomain
  useEffect(() => {
    const ctx = resolveContext();
    if (ctx.slug || ctx.id) {
      fetchTenant(ctx);
    } else {
      setIsLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Secondary resolution: when auth context provides tenantId (fixes race condition)
  useEffect(() => {
    const tenantId = user?.tenantId;
    if (!tenantId) return;
    // Only fetch if we haven't already resolved this tenant
    if (resolvedId === tenantId) return;
    fetchTenant({ id: tenantId });
  }, [user?.tenantId, resolvedId, fetchTenant]);

  const value = useMemo(() => ({ tenant, isLoading, error }), [tenant, isLoading, error]);

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};
