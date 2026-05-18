"use client"
import React from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { NavUser } from './nav-user'
import { ToggleMode } from '../toggle-mode'

const PAGE_TITLES: Record<string, string> = {
  // Admin restaurant
  '/admin/dashboard':            'Tableau de bord',
  '/admin/orders':               'Commandes',
  '/admin/kitchen':              'Cuisine (KDS)',
  '/admin/cash-register':        'Caisse enregistreuse',
  '/admin/tables':               'Gestion des tables',
  '/admin/menu':                 'Carte & menu',
  '/admin/categories':           'Catégories',
  '/admin/customers':            'Clients',
  '/admin/inventory':            'Inventaire',
  '/admin/messages':             'Messages',
  '/admin/reservations':         'Réservations',
  '/admin/reports':              'Rapports',
  '/admin/billing':              'Abonnement',
  '/admin/settings':             'Paramètres',
  '/admin/settings/permissions': 'Permissions',
  '/admin/support':              'Support',
  '/admin/onboarding':           'Configuration initiale',
  // Super Admin
  '/super-admin/dashboard':      'Vue d\'ensemble',
  '/super-admin/tenants':        'Restaurants',
  '/super-admin/users':          'Utilisateurs',
  '/super-admin/billing':        'Facturation',
  '/super-admin/plans':          'Abonnements',
  '/super-admin/settings':       'Paramètres globaux',
  '/super-admin/maintenance':    'Maintenance',
  '/super-admin/domains':        'Domaines',
}

interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  fixed?: boolean
  ref?: React.Ref<HTMLElement>
  user: {
    name: string
    email: string
    avatar: string
    role: string
  }
}

export const Header = ({
  className,
  fixed,
  user,
  ...props
}: HeaderProps) => {
  const pathname = usePathname()
  const [offset, setOffset] = React.useState(0)

  React.useEffect(() => {
    const onScroll = () =>
      setOffset(document.body.scrollTop || document.documentElement.scrollTop)
    document.addEventListener('scroll', onScroll, { passive: true })
    return () => document.removeEventListener('scroll', onScroll)
  }, [])

  const pageTitle = PAGE_TITLES[pathname] ?? 'Administration'

  return (
    <header
      className={cn(
        'bg-background/95 backdrop-blur-sm border-b border-border/60',
        'flex h-14 sm:h-16 items-center gap-2 px-3 py-2 sm:gap-4 sm:px-6',
        fixed && 'header-fixed peer/header fixed z-50 w-[inherit]',
        offset > 10 && fixed ? 'shadow-sm' : 'shadow-none',
        'transition-shadow duration-200',
        className
      )}
      {...props}
    >
      <SidebarTrigger variant='outline' className='h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0' />
      <Separator orientation='vertical' className='h-5 hidden sm:block' />
      <h1 className='text-sm sm:text-lg font-semibold text-foreground truncate'>
        {pageTitle}
      </h1>
      <div className='ml-auto flex items-center gap-2 sm:gap-3'>
        <ToggleMode />
        <Separator orientation='vertical' className='h-5 hidden sm:block' />
        <NavUser user={user} />
      </div>
    </header>
  )
}

Header.displayName = 'Header'
