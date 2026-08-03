"use client"
import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { NavGroup } from '@/components/admin_v2/nav-group'
import { NavUser } from '@/components/admin_v2/nav-user'
import { getSidebarData } from '@/components/admin_v2/data/sidebar-data'
import Link from 'next/link'
import { ChefHat, Utensils } from 'lucide-react'

interface AppSidebarProps {
  user: {
    name: string
    email: string
    avatar: string
    role: string
  }
  counts?: {
    pendingOrders: number
    unreadMessages: number
    pendingReservations: number
  }
}

export function AppSidebar({ user, counts, ...props }: AppSidebarProps) {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  // Tous les modules sont disponibles : le logiciel est installé pour cet
  // établissement, il n'y a plus de fonctionnalité à débloquer.
  const sidebarData = getSidebarData(
    counts ?? { pendingOrders: 0, unreadMessages: 0, pendingReservations: 0 },
  )

  return (
    <Sidebar collapsible='icon' variant='floating' {...props}>

      {/* Header — logo adaptatif selon l'état collapsed/expanded */}
      <SidebarHeader className="overflow-hidden p-2">
        <Link
          href='/admin/dashboard'
          className={cn(
            'flex items-center rounded-xl transition-all duration-200 ease-linear',
            'hover:bg-sidebar-accent group overflow-hidden',
            isCollapsed
              ? 'size-8 justify-center gap-0 p-0'
              : 'gap-3 p-2'
          )}
        >
          {/* Icône logo — se réduit proprement */}
          <div className="relative flex-shrink-0">
            <div className={cn(
              'rounded-lg shadow-sm transition-all duration-200 ease-linear',
              'bg-primary group-hover:bg-primary/90',
              isCollapsed ? 'p-1.5' : 'p-2'
            )}>
              <ChefHat className={cn(
                'text-primary-foreground transition-all duration-200 ease-linear',
                isCollapsed ? 'h-4 w-4' : 'h-5 w-5'
              )} />
              {/* Icône décorative cachée en mode collapsed pour éviter le débordement */}
              {!isCollapsed && (
                <Utensils className="h-2.5 w-2.5 absolute -bottom-0.5 -right-0.5 text-primary-foreground/70" />
              )}
            </div>
          </div>

          {/* Texte — width → 0 + opacity → 0 en collapsed pour une transition fluide */}
          <div className={cn(
            'overflow-hidden transition-all duration-200 ease-linear',
            isCollapsed
              ? 'w-0 opacity-0 pointer-events-none'
              : 'min-w-0 flex-1 opacity-100'
          )}>
            <span className="font-bold text-base truncate block text-sidebar-foreground whitespace-nowrap">
              Flash Menu
            </span>
            <p className="text-[10px] truncate font-semibold uppercase tracking-widest whitespace-nowrap text-primary">
              Administration
            </p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {sidebarData.navGroups.map((group) => (
          <NavGroup key={group.title} {...group} />
        ))}
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={{
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
        }} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
