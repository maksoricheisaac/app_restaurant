import {
  LayoutDashboard,
  Settings,
  Users,
  Store,
  CreditCard,
  ShieldCheck,
  Sparkles,
  Globe,
  Bell
} from 'lucide-react'
import { type SidebarData } from '../types'

export function getSuperAdminSidebarData(): SidebarData {
  return {
    navGroups: [
      {
        title: 'Plateforme',
        items: [
          {
            title: 'Vue d\'ensemble',
            url: '/super-admin/dashboard',
            icon: LayoutDashboard,
          },
          {
            title: 'Restaurants',
            url: '/super-admin/tenants',
            icon: Store,
          },
          {
            title: 'Utilisateurs',
            url: '/super-admin/users',
            icon: Users,
          },
        ],
      },
      {
        title: 'Business',
        items: [
          {
            title: 'Facturation',
            url: '/super-admin/billing',
            icon: CreditCard,
          },
          {
            title: 'Abonnements',
            url: '/super-admin/plans',
            icon: Sparkles,
          },
        ],
      },
      {
        title: 'Système',
        items: [
          {
            title: 'Paramètres globaux',
            url: '/super-admin/settings',
            icon: Settings,
          },
          {
            title: 'Maintenance',
            url: '/super-admin/maintenance',
            icon: ShieldCheck,
          },
          {
            title: 'Domaines',
            url: '/super-admin/domains',
            icon: Globe,
          },
        ],
      },
    ],
  }
}
