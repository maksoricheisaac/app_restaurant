'use client';

import { ReactNode } from 'react';
import { SocketProvider } from '@/components/providers/SocketProvider';

/**
 * Client wrapper that provides the Socket.io context to the admin layout tree.
 * Lives outside the Server Component boundary so the SocketProvider (which uses
 * useEffect) can be mounted correctly.
 */
export function AdminSocketWrapper({
  children,
  tenantId,
}: {
  children: ReactNode;
  tenantId?: string;
}) {
  return <SocketProvider tenantId={tenantId}>{children}</SocketProvider>;
}
