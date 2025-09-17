/* eslint-disable react/no-unescaped-entities */
"use client"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
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
  counts: {
    pendingOrders: number
    unreadMessages: number
    pendingReservations: number
  }
}
export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const sidebarData = getSidebarData(props.counts)
  return (
    <Sidebar collapsible='icon' variant='floating' {...props}>
      <SidebarHeader>
        <Link 
          href="/admin/dashboard" 
          className="flex items-center gap-3 p-2 transition-all duration-200 hover:bg-white/10 rounded-lg"
        >
          <div className="relative flex-shrink-0">
            <div className="bg-primary p-2 rounded-lg transition-colors duration-200 group-hover:bg-primary">
              <ChefHat className="h-5 w-5 sm:h-6 sm:w-6" />
              <Utensils className="h-2.5 w-2.5 sm:h-3 sm:w-3 absolute -bottom-1 -right-1 " />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <span className="font-semibold text-base sm:text-lg truncate block">Restaurant App</span>
            <p className="text-[10px] sm:text-xs text-primary truncate">Administration</p>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={
          {
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            role: user.role,
          }
        } />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
