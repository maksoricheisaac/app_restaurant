import { AppSidebar } from "@/components/admin_v2/app-sidebar";
import { Header } from "@/components/admin_v2/header";
import { Main } from "@/components/admin_v2/main";
import { SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { headers } from "next/headers";
import { dashboardService } from '@/services/dashboard.service'
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { AdminNotificationProvider } from "@/contexts/AdminNotificationContext";

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const h = await headers();
  const tenantId = h.get('x-tenant-id');
  const tenantSlug = h.get('x-tenant-slug');

  const apiBase = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
  const profileResponse = await fetch(`${apiBase}/auth/profile`, {
    method: 'GET',
    headers: h,
    cache: 'no-store'
  });

  if (profileResponse.status === 401) {
    redirect('/auth/login');
  }

  const user = await profileResponse.json();
  
  if (!user) {
    redirect('/auth/login');
  }

  // Super admin sans contexte de tenant → dashboard super admin
  if (user.platformRole === 'super_admin' && !tenantId && !tenantSlug) {
    redirect('/super-admin/dashboard');
  }

  // Utilisateur normal avec onboarding non terminé et sans tenant → inscription
  if (user.platformRole !== 'super_admin' && !user.onboardingCompleted && !user.tenantId) {
    redirect('/auth/register');
  }

  // Onboarding terminé mais pas de restaurant assigné (Multi-Manager / Franchise en attente d'invitation)
  if (
    user.platformRole !== 'super_admin' &&
    user.onboardingCompleted &&
    !tenantId && !tenantSlug && !user.tenantId
  ) {
    redirect('/pending-invite');
  }

  let counts = { pendingOrders: 0, unreadMessages: 0, pendingReservations: 0, orders: 0, reservations: 0 };

  if (tenantId || tenantSlug) {
    try {
      const countsResponse = await dashboardService.getSidebarCounts({
        headers: h
      });
      if (countsResponse) {
        counts = {
          pendingOrders: countsResponse.orders ?? 0,
          unreadMessages: 0,
          pendingReservations: countsResponse.reservations ?? 0,
          orders: countsResponse.orders ?? 0,
          reservations: countsResponse.reservations ?? 0,
        };
      }
    } catch (e) {
      console.error("Error fetching sidebar counts:", e);
    }
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <AdminNotificationProvider>
        <AppSidebar counts={counts} user={user} />
        <div
          id='admin-layout-content'
          className={cn(
            'w-full max-w-full',
            'lg:ml-auto',
            'peer-data-[state=collapsed]:lg:w-[calc(100%-var(--sidebar-width-icon)-1rem)]',
            'peer-data-[state=expanded]:lg:w-[calc(100%-var(--sidebar-width))]',
            'transition-[width] duration-200 ease-linear',
            'flex min-h-screen flex-col',
            'group-data-[scroll-locked=1]/body:h-full',
            'has-[main.fixed-main]:group-data-[scroll-locked=1]/body:h-svh'
          )}
        >
          <Header fixed user={user} />
          <Main>
            {children}
          </Main>
        </div>
      </AdminNotificationProvider>
    </SidebarProvider>
  );
}
