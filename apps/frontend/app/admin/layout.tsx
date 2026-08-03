import { AppSidebar } from "@/components/admin_v2/app-sidebar";
import { Header } from "@/components/admin_v2/header";
import { Main } from "@/components/admin_v2/main";
import { AdminSocketWrapper } from "@/components/admin_v2/admin-socket-wrapper";
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

const apiBase =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3000/api/v1';

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const h = await headers();

  // Tant que l'assistant de première installation n'a pas tourné, il n'y a ni
  // établissement ni propriétaire : l'administration n'a rien à afficher.
  const setup = await fetch(`${apiBase}/setup/status`, { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);

  if (setup?.required) {
    redirect('/setup');
  }

  const profileResponse = await fetch(`${apiBase}/auth/profile`, {
    method: 'GET',
    headers: h,
    cache: 'no-store',
  });

  if (profileResponse.status === 401) {
    redirect('/auth/login');
  }

  const user = await profileResponse.json();

  if (!user) {
    redirect('/auth/login');
  }

  let counts = {
    pendingOrders: 0,
    unreadMessages: 0,
    pendingReservations: 0,
    orders: 0,
    reservations: 0,
  };

  try {
    const countsResponse = await dashboardService.getSidebarCounts({ headers: h });
    if (countsResponse) {
      counts = {
        pendingOrders: countsResponse.pendingOrders ?? 0,
        unreadMessages: countsResponse.unreadMessages ?? 0,
        pendingReservations: countsResponse.pendingReservations ?? 0,
        orders: countsResponse.orders ?? 0,
        reservations: countsResponse.reservations ?? 0,
      };
    }
  } catch (e) {
    console.error("Error fetching sidebar counts:", e);
  }

  return (
    <AdminSocketWrapper>
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
    </AdminSocketWrapper>
  );
}
