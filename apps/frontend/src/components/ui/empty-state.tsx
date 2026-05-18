"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        "rounded-xl border-2 border-dashed border-muted/60 bg-muted/10",
        className,
      )}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/40 text-muted-foreground">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">{description}</p>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {action && (
          <Button onClick={action.onClick} className="w-full sm:w-auto">
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <a href={secondaryAction.href}>{secondaryAction.label}</a>
          </Button>
        )}
      </div>
    </div>
  );
}
