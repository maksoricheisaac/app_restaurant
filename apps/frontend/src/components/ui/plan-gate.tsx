"use client";

import { ReactNode } from "react";
import { Lock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlan } from "@/hooks/usePlan";
import { cn } from "@/lib/utils";
import Link from "next/link";

type Plan = "free" | "pro" | "enterprise";

interface PlanGateProps {
  requiredPlan: Plan;
  children: ReactNode;
  featureName?: string;
  className?: string;
}

const PLAN_LABELS: Record<Plan, string> = {
  free: "Gratuit",
  pro: "Pro",
  enterprise: "Enterprise",
};

export function PlanGate({
  requiredPlan,
  children,
  featureName = "cette fonctionnalité",
  className,
}: PlanGateProps) {
  const { hasAccess } = usePlan();

  if (hasAccess(requiredPlan)) {
    return <>{children}</>;
  }

  return (
    <div className={cn("relative", className)}>
      <div className="pointer-events-none select-none opacity-30 blur-[2px]">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-base font-semibold">
              Passez au plan {PLAN_LABELS[requiredPlan]}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {featureName} est disponible à partir du plan {PLAN_LABELS[requiredPlan]}.
            </p>
          </div>
          <Button asChild size="sm" className="gap-2">
            <Link href="/admin/settings?tab=billing">
              <Zap className="h-4 w-4" />
              Mettre à niveau
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
