import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { ReactNode } from "react";

const variants = {
  orange: {
    border:  "border-l-orange-500",
    iconBg:  "bg-orange-100 dark:bg-orange-950/60",
    icon:    "text-orange-600 dark:text-orange-400",
    trend:   { up: "text-orange-600 dark:text-orange-400" },
  },
  green: {
    border:  "border-l-green-500",
    iconBg:  "bg-green-100 dark:bg-green-950/60",
    icon:    "text-green-600 dark:text-green-400",
    trend:   { up: "text-green-600 dark:text-green-400" },
  },
  blue: {
    border:  "border-l-blue-500",
    iconBg:  "bg-blue-100 dark:bg-blue-950/60",
    icon:    "text-blue-600 dark:text-blue-400",
    trend:   { up: "text-blue-600 dark:text-blue-400" },
  },
  purple: {
    border:  "border-l-purple-500",
    iconBg:  "bg-purple-100 dark:bg-purple-950/60",
    icon:    "text-purple-600 dark:text-purple-400",
    trend:   { up: "text-purple-600 dark:text-purple-400" },
  },
  emerald: {
    border:  "border-l-emerald-500",
    iconBg:  "bg-emerald-100 dark:bg-emerald-950/60",
    icon:    "text-emerald-600 dark:text-emerald-400",
    trend:   { up: "text-emerald-600 dark:text-emerald-400" },
  },
  amber: {
    border:  "border-l-amber-500",
    iconBg:  "bg-amber-100 dark:bg-amber-950/60",
    icon:    "text-amber-600 dark:text-amber-400",
    trend:   { up: "text-amber-600 dark:text-amber-400" },
  },
  rose: {
    border:  "border-l-rose-500",
    iconBg:  "bg-rose-100 dark:bg-rose-950/60",
    icon:    "text-rose-600 dark:text-rose-400",
    trend:   { up: "text-rose-600 dark:text-rose-400" },
  },
  slate: {
    border:  "border-l-slate-500",
    iconBg:  "bg-slate-100 dark:bg-slate-800/60",
    icon:    "text-slate-600 dark:text-slate-400",
    trend:   { up: "text-slate-600 dark:text-slate-400" },
  },
} as const;

export type StatsCardVariant = keyof typeof variants;

export interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  variant?: StatsCardVariant;
  trend?: {
    value: number;
    label?: string;
  };
  subtitle?: string;
  isLoading?: boolean;
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon,
  variant = "orange",
  trend,
  subtitle,
  isLoading = false,
  className,
}: StatsCardProps) {
  const v = variants[variant];

  if (isLoading) {
    return (
      <div
        className={cn(
          "bg-card border border-border border-l-4 rounded-xl p-5 shadow-sm",
          v.border,
          className,
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2.5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
        </div>
      </div>
    );
  }

  const isUp   = trend && trend.value > 0;
  const isDown = trend && trend.value < 0;
  const TrendIcon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;

  return (
    <div
      className={cn(
        "bg-card border border-border border-l-4 rounded-xl p-5",
        "shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5",
        v.border,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground truncate leading-none">
            {title}
          </p>
          <p className="text-2xl font-bold text-foreground mt-2 truncate leading-none">
            {value}
          </p>
          {(trend || subtitle) && (
            <div className="flex items-center gap-1.5 mt-2">
              {trend && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 text-xs font-semibold",
                    isUp   && "text-green-600 dark:text-green-400",
                    isDown && "text-red-500   dark:text-red-400",
                    !isUp && !isDown && "text-muted-foreground",
                  )}
                >
                  <TrendIcon className="h-3 w-3" />
                  {Math.abs(trend.value)}%
                </span>
              )}
              {subtitle && (
                <span className="text-xs text-muted-foreground truncate">
                  {subtitle}
                </span>
              )}
            </div>
          )}
        </div>
        <div className={cn("p-2.5 rounded-lg flex-shrink-0", v.iconBg)}>
          <div className={cn("h-5 w-5", v.icon)}>{icon}</div>
        </div>
      </div>
    </div>
  );
}
