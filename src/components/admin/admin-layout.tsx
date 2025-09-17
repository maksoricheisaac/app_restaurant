/* eslint-disable react/no-unescaped-entities */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, ShoppingCart, Users, Calendar, Settings, LogOut,
  Menu, X, ChefHat, Utensils, MapPin, Package, BarChart3, MessageSquare,
  ChevronLeft, ChevronRight, Folder
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSession, authClient } from '@/lib/auth-client';
import { NavUser } from '@/components/nav-user';
import { useRole } from '@/hooks/useRole';
import { useIsClient, useMediaQuery } from '@/hooks/useIsClient';


const navigation = [
  { name: 'Tableau de bord', href: '/admin/dashboard', icon: LayoutDashboard, badge: null, roles: ['admin', 'manager'] },
  { name: 'Commandes', href: '/admin/orders', icon: ShoppingCart, badge: '12', roles: ['admin', 'manager'] },
  { name: 'Clients', href: '/admin/customers', icon: Users, badge: null, roles: ['admin', 'manager'] },
  { name: 'Tables & QR', href: '/admin/tables', icon: MapPin, badge: null, roles: ['admin', 'manager'] },
  { name: 'Menu', href: '/admin/menu', icon: Package, badge: null, roles: ['admin', 'manager'] },
  { name: 'Catégories', href: '/admin/categories', icon: Folder, badge: null, roles: ['admin', 'manager'] },
  { name: 'Réservations', href: '/admin/reservations', icon: Calendar, badge: '5', roles: ['admin', 'manager'] },
  { name: 'Rapports', href: '/admin/reports', icon: BarChart3, badge: null, roles: ['admin', 'manager'] },
  { name: 'Messages', href: '/admin/messages', icon: MessageSquare, badge: '3', roles: ['admin', 'manager'] },
  { name: 'Paramètres', href: '/admin/settings', icon: Settings, badge: null, roles: ['admin'] }, // Admin seulement
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = authClient;
  const { data: session } = useSession();
  const { hasRole } = useRole();

  // Utilisation des hooks personnalisés pour éviter les problèmes d'hydratation
  const isClient = useIsClient();
  const isLargeScreen = useMediaQuery('(min-width: 1280px)');
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => router.push('/login'),
      },
    });
  };

  const currentPage = navigation.find(item => item.href === pathname);

  // Affichage par défaut pendant l'hydratation (mobile layout)
  if (!isClient || !isLargeScreen) {
    return (
      <div className="min-h-screen flex bg-gray-50">
        {/* Mobile Sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <aside className={cn(
          "fixed z-50 top-0 left-0 h-full w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex items-center justify-between h-20 px-6 bg-gradient-to-r from-orange-600 to-orange-700">
            <Link href="/admin/dashboard" className="flex items-center space-x-3 text-white">
              <div className="relative">
                <div className="bg-white/20 p-2 rounded-xl">
                  <ChefHat className="h-6 w-6" />
                  <Utensils className="h-3 w-3 absolute -bottom-1 -right-1 text-orange-200" />
                </div>
              </div>
              <div>
                <span className="font-bold text-lg">Saveurs d'Afrique</span>
                <p className="text-xs text-orange-100">Administration</p>
              </div>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)} className="text-white">
              <X className="w-5 h-5" />
            </Button>
          </div>
          <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-2">
            {navigation.map(item => {
              const isActive = item.href === pathname;
              
              
              return (
                <Link key={item.name} href={item.href} onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium group transition-all",
                    isActive
                      ? "bg-orange-600 text-white"
                      : "text-gray-700 hover:bg-orange-100 hover:text-orange-700"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <Badge className="bg-orange-600 text-white">{item.badge}</Badge>
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 text-gray-700 hover:text-red-600"
            >
              <LogOut className="h-5 w-5" />
              <span>Déconnexion</span>
            </Button>
          </div>
        </aside>

        {/* Topbar */}
        <div className="flex flex-col w-full">
          <header className="sticky top-0 z-30 flex items-center h-16 border-b bg-white px-4 shadow-sm">
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)} className="xl:hidden">
              <Menu className="h-5 w-5" />
            </Button>
            <div className="ml-auto flex items-center gap-4">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                En ligne
              </Badge>
              <NavUser user={{
                name: session?.user?.name || "Admin",
                email: session?.user?.email || "admin@example.com",
                avatar: session?.user?.image || "/avatar.png"
              }} />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto px-4 py-6">  
            {children}
          </main>
        </div>
      </div>
    );
  }

  // Desktop layout (xl and above)
  const sidebarWidthPx = sidebarCollapsed ? 80 : 320; // w-20 = 80px, w-80 = 320px
  const sidebarWidth = sidebarCollapsed ? 'w-20' : 'w-80';
  const contentMargin = sidebarCollapsed ? 'ml-20' : 'ml-80';
  const TOPBAR_HEIGHT = 64; // 4rem = 64px

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      <aside className={cn("fixed inset-y-0 left-0 z-50 bg-white border-r shadow-xl flex flex-col transition-all duration-300", sidebarWidth)}>
        <div className="flex items-center justify-between h-20 px-6 bg-gradient-to-r from-orange-600 to-orange-700">
          <Link href="/admin/dashboard" className="flex items-center space-x-3 text-white">
            <div className="relative">
              <div className="bg-white/20 p-3 rounded-xl">
                <ChefHat className="h-7 w-7" />
                <Utensils className="h-4 w-4 absolute -bottom-1 -right-1 text-orange-200" />
              </div>
            </div>
            {!sidebarCollapsed && (
              <div>
                <span className="font-bold text-xl">Resto_Congo</span>
                <p className="text-sm text-orange-100">Administration</p>
              </div>
            )}
          </Link>
          
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigation.map(item => {
            const isActive = item.href === pathname;
            
            
            return (
              <Link key={item.name} href={item.href}
                className={cn(
                  "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium group transition-all",
                  isActive
                    ? "bg-orange-600 text-white"
                    : "text-gray-700 hover:bg-orange-100 hover:text-orange-700",
                  sidebarCollapsed && "justify-center"
                )}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <div className={cn("flex items-center", sidebarCollapsed ? "justify-center" : "space-x-3")}> 
                  <item.icon className="w-5 h-5" />
                  {!sidebarCollapsed && <span>{item.name}</span>}
                </div>
                {!sidebarCollapsed && item.badge && (
                  <Badge className="bg-orange-600 text-white">{item.badge}</Badge>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className={cn("flex-1 flex flex-col h-screen transition-all duration-300", contentMargin)}>
        {/* Topbar full width, but shifted right by sidebar width */}
        <header
          className="fixed top-0 z-40 flex items-center h-16 border-b bg-white px-8 shadow-sm transition-all duration-300"
          style={{
            height: TOPBAR_HEIGHT,
            left: sidebarWidthPx,
            width: `calc(100vw - ${sidebarWidthPx}px)`
          }}
        >
          <div className="flex-1 flex items-center">
            <Button variant="ghost" size="sm" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="xl:inline-flex hidden mr-2">
              {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </Button>
            <span className="font-bold text-lg text-orange-700 whitespace-nowrap">Administration</span>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              En ligne
            </Badge>
            <NavUser user={{
              name: session?.user?.name || "Admin",
              email: session?.user?.email || "admin@example.com",
              avatar: session?.user?.image || "/avatar.png"
            }} />
          </div>
        </header>
        {/* Main content with padding-top for topbar */}
        <main 
          className="flex-1 w-full overflow-y-auto px-4 lg:px-8" 
          style={{ 
            paddingTop: `calc(${TOPBAR_HEIGHT}px + 1.5rem)`,
            height: '100vh',
            width: `calc(100vw - ${sidebarWidthPx}px)`
          }}
        >
          <div className="h-full w-full py-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
