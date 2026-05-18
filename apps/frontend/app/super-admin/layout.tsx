import { AppSidebar } from "@/components/admin_v2/app-sidebar";
import { Header } from "@/components/admin_v2/header";
import { Main } from "@/components/admin_v2/main";
import { SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export default async function SuperAdminLayout({ children }: { children: ReactNode }) {
  const h = await headers();

  const apiBase = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
  const profileResponse = await fetch(`${apiBase}/auth/profile`, {
    method: 'GET',
    headers: h,
    cache: 'no-store',
  });

  if (profileResponse.status === 401) {
    redirect('/auth/login');
  }

  const user = await profileResponse.json();

  if (!user || user.platformRole !== 'super_admin') {
    redirect('/auth/login');
  }

  const sidebarUser = {
    name: user.name,
    email: user.email,
    avatar: user.image || '',
    role: 'Super Admin',
  };

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar user={sidebarUser} isSuperAdmin={true} />
      <div
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
        <Header fixed user={sidebarUser} />
        <Main>{children}</Main>
      </div>
    </SidebarProvider>
  );
}
