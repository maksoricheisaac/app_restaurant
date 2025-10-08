"use client";

import { usePermissions } from '@/hooks/usePermissions';
import { adminNav } from '@/config/admin-navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LucideIcon } from 'lucide-react';

interface AdminNavigationProps {
  className?: string;
}

export function AdminNavigation({ className }: AdminNavigationProps) {
  const { hasPermission } = usePermissions();
  const pathname = usePathname();

  // Filtrer les éléments de navigation selon les permissions
  const filteredNav = adminNav.filter(item => hasPermission(item.permission));

  return (
    <nav className={cn("space-y-2", className)}>
      {filteredNav.map((item) => {
        const Icon = item.icon as LucideIcon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}

// Version pour sidebar mobile
export function AdminNavigationMobile({ className }: AdminNavigationProps) {
  const { hasPermission } = usePermissions();
  const pathname = usePathname();

  const filteredNav = adminNav.filter(item => hasPermission(item.permission));

  return (
    <div className={cn("grid gap-2", className)}>
      {filteredNav.map((item) => {
        const Icon = item.icon as LucideIcon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.name}
          </Link>
        );
      })}
    </div>
  );
}
