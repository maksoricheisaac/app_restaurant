"use client"
import React from 'react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { NavUser } from './nav-user'
import { ToggleMode } from '../toggle-mode'

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
  const [offset, setOffset] = React.useState(0)

  React.useEffect(() => {
    const onScroll = () => {
      setOffset(document.body.scrollTop || document.documentElement.scrollTop)
    }

    // Add scroll listener to the body
    document.addEventListener('scroll', onScroll, { passive: true })

    // Clean up the event listener on unmount
    return () => document.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'bg-background flex h-14 sm:h-16 items-center gap-2 px-3 py-2 sm:gap-4 sm:p-4',
        fixed && 'header-fixed peer/header fixed z-50 w-[inherit] rounded-md',
        offset > 10 && fixed ? 'shadow-sm' : 'shadow-none',
        className
      )}
      {...props}
    >
      <SidebarTrigger variant='outline' className='h-9 w-9 sm:h-10 sm:w-10' />
      <Separator orientation='vertical' className='h-6 hidden sm:block' />
      <h1 className='text-base sm:text-2xl font-bold truncate'>Administration</h1>
      <div className='ml-auto flex items-center gap-2 sm:gap-4'>
        <div className='hidden sm:block'>
          <NavUser user={user} />
        </div>
        <ToggleMode />
      </div>
    </header>
  )
}

Header.displayName = 'Header'
