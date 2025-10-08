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

  // Vérifier que l'utilisateur est connecté et a un rôle staff
  const staffRoles = ["admin", "owner", "manager", "head_chef", "chef", "waiter", "cashier"];
  if(!session?.user || !session?.user?.role || !staffRoles.includes(session?.user?.role)){
    return redirect("/login")
  }

  const user = {
    name: session?.user?.name ?? "",
    email: session?.user?.email ?? "",
    avatar: session?.user?.image ?? "",
    role: session?.user?.role ?? "",
  };
  
  return (
    <SidebarProvider defaultOpen={false}>
      <AdminNotificationProvider>
        <AppSidebar counts={counts} user={user} />
      <div
        id='content'
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
