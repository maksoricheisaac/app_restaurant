import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  badge,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-start justify-between gap-4",
        className,
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {title}
          </h1>
          {badge && <div className="flex items-center">{badge}</div>}
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      {action && (
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          {action}
        </div>
      )}
    </div>
  );
}
