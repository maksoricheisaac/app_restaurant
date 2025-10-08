"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

interface ResponsiveTableProps {
  children: ReactNode
  className?: string
}

/**
 * Wrapper pour rendre les tableaux responsive sur mobile
 * Sur mobile: affiche en mode card
 * Sur desktop: affiche le tableau normal
 */
export function ResponsiveTable({ children, className }: ResponsiveTableProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* Desktop: tableau normal avec scroll horizontal si nécessaire */}
      <div className="hidden md:block overflow-x-auto">
        <div className="min-w-full inline-block align-middle">
          {children}
        </div>
      </div>
      
      {/* Mobile: affichage en cards (à implémenter dans chaque composant) */}
      <div className="md:hidden">
        {children}
      </div>
    </div>
  )
}

interface MobileCardProps {
  children: ReactNode
  className?: string
}

/**
 * Card pour affichage mobile des éléments de tableau
 */
export function MobileCard({ children, className }: MobileCardProps) {
  return (
    <Card className={cn("p-4 mb-3 space-y-3", className)}>
      {children}
    </Card>
  )
}

interface MobileCardRowProps {
  label: string
  value: ReactNode
  className?: string
}

/**
 * Ligne d'information dans une MobileCard
 */
export function MobileCardRow({ label, value, className }: MobileCardRowProps) {
  return (
    <div className={cn("flex justify-between items-center", className)}>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  )
}

interface ResponsiveContainerProps {
  children: ReactNode
  className?: string
}

/**
 * Container responsive pour les pages admin
 * Gère les paddings et espacements selon la taille d'écran
 */
export function ResponsiveContainer({ children, className }: ResponsiveContainerProps) {
  return (
    <div className={cn(
      "w-full",
      "px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6 lg:px-8 lg:py-8",
      className
    )}>
      {children}
    </div>
  )
}

interface ResponsiveGridProps {
  children: ReactNode
  className?: string
  cols?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
}

/**
 * Grille responsive avec colonnes adaptatives
 */
export function ResponsiveGrid({ 
  children, 
  className,
  cols = { default: 1, sm: 2, md: 2, lg: 3, xl: 4 }
}: ResponsiveGridProps) {
  const gridCols = cn(
    "grid gap-4",
    cols.default === 1 && "grid-cols-1",
    cols.default === 2 && "grid-cols-2",
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    className
  )
  
  return (
    <div className={gridCols}>
      {children}
    </div>
  )
}

interface TouchTargetProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

/**
 * Wrapper pour assurer des zones de touch de 44x44px minimum
 */
export function TouchTarget({ children, className, onClick }: TouchTargetProps) {
  return (
    <div 
      className={cn("min-h-[44px] min-w-[44px] flex items-center justify-center", className)}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
