import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getLimitsForPlan, PlanFeatures } from '../plans/plans.config';

@Injectable()
export class FeatureFlagsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns true if the feature is enabled for the tenant.
   * Resolution order:
   *   1. Tenant-specific DB override (FeatureFlag table)
   *   2. Plan default (plans.config.ts)
   * This allows progressive rollout and per-tenant exceptions.
   */
  async isEnabled(tenantId: string, featureKey: string): Promise<boolean> {
    // Check DB override first
    const override = await this.prisma.featureFlag.findUnique({
      where: { tenantId_key: { tenantId, key: featureKey } },
      select: { enabled: true },
    });

    if (override !== null) {
      return override.enabled;
    }

    // Fall back to plan-based default
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true },
    });

    const limits = getLimitsForPlan(String(tenant?.plan ?? 'free'));
    const planFeatures = limits.features as unknown as Record<string, boolean>;
    return planFeatures[featureKey] ?? false;
  }

  /** Throws ForbiddenException if the feature is not available. */
  async assertEnabled(tenantId: string, featureKey: string): Promise<void> {
    const enabled = await this.isEnabled(tenantId, featureKey);
    if (!enabled) {
      throw new ForbiddenException(
        `La fonctionnalité "${featureKey}" n'est pas disponible sur votre plan actuel.`,
      );
    }
  }

  /** Plan-feature shortcut (no DB lookup for plan-based features). */
  async assertPlanFeature(tenantId: string, feature: keyof PlanFeatures): Promise<void> {
    return this.assertEnabled(tenantId, feature as string);
  }

  // ─── Admin management (super_admin only) ─────────────────────────────────

  async setFlag(tenantId: string, key: string, enabled: boolean) {
    return this.prisma.featureFlag.upsert({
      where: { tenantId_key: { tenantId, key } },
      update: { enabled },
      create: { tenantId, key, enabled },
    });
  }

  async removeFlag(tenantId: string, key: string) {
    return this.prisma.featureFlag.deleteMany({
      where: { tenantId, key },
    });
  }

  async listFlags(tenantId: string) {
    return this.prisma.featureFlag.findMany({
      where: { tenantId },
    });
  }
}
