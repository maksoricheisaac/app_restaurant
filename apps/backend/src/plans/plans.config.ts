export type PlanName = 'free' | 'pro' | 'enterprise';

export interface PlanFeatures {
  kds: boolean;
  advancedReports: boolean;
  apiAccess: boolean;
  multiSite: boolean;
  customBranding: boolean;
}

export interface PlanLimits {
  maxMenuItems: number;
  maxTables: number;
  maxStaffMembers: number;
  maxMonthlyOrders: number;
  features: PlanFeatures;
}

/** Infinity-safe serialization helper */
export const UNLIMITED = Number.MAX_SAFE_INTEGER;

export const PLAN_LIMITS: Record<PlanName, PlanLimits> = {
  free: {
    maxMenuItems: 5,
    maxTables: 3,
    maxStaffMembers: 2,
    maxMonthlyOrders: 10,
    features: {
      kds: false,
      advancedReports: false,
      apiAccess: false,
      multiSite: false,
      customBranding: false,
    },
  },
  pro: {
    maxMenuItems: UNLIMITED,
    maxTables: 10,
    maxStaffMembers: 5,
    maxMonthlyOrders: UNLIMITED,
    features: {
      kds: true,
      advancedReports: true,
      apiAccess: false,
      multiSite: false,
      customBranding: true,
    },
  },
  enterprise: {
    maxMenuItems: UNLIMITED,
    maxTables: UNLIMITED,
    maxStaffMembers: UNLIMITED,
    maxMonthlyOrders: UNLIMITED,
    features: {
      kds: true,
      advancedReports: true,
      apiAccess: true,
      multiSite: true,
      customBranding: true,
    },
  },
};

export function getLimitsForPlan(plan: string): PlanLimits {
  return PLAN_LIMITS[(plan as PlanName) ?? 'free'] ?? PLAN_LIMITS.free;
}
