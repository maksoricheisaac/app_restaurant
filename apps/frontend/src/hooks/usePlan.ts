import { useTenant } from "@/contexts/TenantContext";

type Plan = "free" | "pro" | "enterprise";

const PLAN_HIERARCHY: Record<Plan, number> = {
  free: 0,
  pro: 1,
  enterprise: 2,
};

export function usePlan() {
  const { tenant } = useTenant();
  const currentPlan: Plan = (tenant?.plan as Plan) ?? "free";

  function hasAccess(requiredPlan: Plan): boolean {
    return PLAN_HIERARCHY[currentPlan] >= PLAN_HIERARCHY[requiredPlan];
  }

  return {
    plan: currentPlan,
    isFree: currentPlan === "free",
    isPro: currentPlan === "pro",
    isEnterprise: currentPlan === "enterprise",
    hasAccess,
  };
}
