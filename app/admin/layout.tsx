import { AppSidebar } from "@/components/admin_v2/app-sidebar";
import { Header } from "@/components/admin_v2/header";
import { Main } from "@/components/admin_v2/main";
import { SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { headers } from "next/headers";
import { getAdminSidebarCounts } from '@/actions/admin/dashboard-actions'
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { AdminNotificationProvider } from "@/contexts/AdminNotificationContext";

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const counts = await getAdminSidebarCounts()
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if(!session?.user || !session?.user?.role || session?.user?.role !== "admin"){
    return redirect("/login")
  }

  const user = {
    name: session?.user?.name ?? "",
    email: session?.user?.email ?? "",
    avatar: session?.user?.image ?? "",
    role: session?.user?.role ?? "",
  };
  
  return (
    <SidebarProvider>
      <AdminNotificationProvider>
        <AppSidebar counts={counts} user={user} />
      <div
        id='content'
        className={cn(
          'ml-auto w-full max-w-full',
          'peer-data-[state=collapsed]:w-[calc(100%-var(--sidebar-width-icon)-1rem)]',
          'peer-data-[state=expanded]:w-[calc(100%-var(--sidebar-width))]',
          'sm:transition-[width] sm:duration-200 sm:ease-linear',
          'flex h-svh flex-col',
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
