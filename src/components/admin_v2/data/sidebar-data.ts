import {
  LayoutDashboard,
  Settings,
  Users,
  UtensilsCrossed,
  FileBarChart,
  Table2,
  ListTree,
  ShoppingBag,
  AlertCircle,
  CreditCard,
  Blocks
} from 'lucide-react'
import { type SidebarData } from '../types'

export function getSidebarData(counts: { pendingOrders: number, unreadMessages: number, pendingReservations: number }): SidebarData {
  return {
    navGroups: [
      {
        title: 'Principal',
        items: [
          {
            title: 'Tableau de bord',
            url: '/admin/dashboard',
            icon: LayoutDashboard,
          },
          {
            title: 'Commandes',
            url: '/admin/orders',
            icon: ShoppingBag,
            badge: counts.pendingOrders > 0 ? String(counts.pendingOrders) : undefined,
          },
          {
            title: 'Caisse',
            url: '/admin/cash-register',
            icon: CreditCard,
          },
          /* {
            title: 'Réservations',
            url: '/admin/reservations',
            icon: Calendar,
            badge: counts.pendingReservations > 0 ? String(counts.pendingReservations) : undefined,
          }, */
          {
            title: 'Tables',
            url: '/admin/tables',
            icon: Table2,
          }
        ],
      },
      {
        title: 'Gestion',
        items: [
          {
            title: 'Menu',
            url: '/admin/menu',
            icon: UtensilsCrossed,
          },
          {
            title: 'Catégories',
            url: '/admin/categories',
            icon: ListTree,
          },
          {
            title: 'Clients',
            url: '/admin/customers',
            icon: Users,
          },
          {
            title: 'Inventaire / Stock',
            url: '/admin/inventory',
            icon: Blocks,
          },
          /* {
            title: 'Messages',
            url: '/admin/messages',
            icon: MessageSquare,
            badge: counts.unreadMessages > 0 ? String(counts.unreadMessages) : undefined,
          }, */
        ],
      },
      {
        title: 'Administration',
        items: [
          {
            title: 'Rapports',
            url: '/admin/reports',
            icon: FileBarChart,
            
          },
          {
            title: 'Paramètres',
            url: '/admin/settings',
            icon: Settings,
          },
          {
            title: 'Support',
            url: '/admin/support',
            icon: AlertCircle,
          }
        ],
      },
    ],
  }
}
