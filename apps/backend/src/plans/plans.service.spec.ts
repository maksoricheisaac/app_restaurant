import { ForbiddenException } from '@nestjs/common';
import { PlanLimitService } from './plans.service';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';
import { PLAN_LIMITS, UNLIMITED } from './plans.config';

describe('PlanLimitService', () => {
  let service: PlanLimitService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new PlanLimitService(prisma as any);
  });

  // ─── assertMenuItemLimit ────────────────────────────────────────────────

  describe('assertMenuItemLimit', () => {
    it('allows creation when count < limit (FREE plan)', async () => {
      prisma.tenant.findUnique.mockResolvedValue({
        plan: 'free',
        status: 'active',
      });
      prisma.menuItem.count.mockResolvedValue(4); // limit is 5

      await expect(service.assertMenuItemLimit('t1')).resolves.toBeUndefined();
    });

    it('throws ForbiddenException when count >= limit (FREE plan)', async () => {
      prisma.tenant.findUnique.mockResolvedValue({
        plan: 'free',
        status: 'active',
      });
      prisma.menuItem.count.mockResolvedValue(5); // exactly at limit

      await expect(service.assertMenuItemLimit('t1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('never throws for PRO plan (unlimited)', async () => {
      prisma.tenant.findUnique.mockResolvedValue({
        plan: 'pro',
        status: 'active',
      });
      prisma.menuItem.count.mockResolvedValue(9999);

      await expect(service.assertMenuItemLimit('t1')).resolves.toBeUndefined();
      // Should short-circuit and never query menuItem count
      expect(prisma.menuItem.count).not.toHaveBeenCalled();
    });

    it('never throws for ENTERPRISE plan (unlimited)', async () => {
      prisma.tenant.findUnique.mockResolvedValue({
        plan: 'enterprise',
        status: 'active',
      });
      prisma.menuItem.count.mockResolvedValue(10000);

      await expect(service.assertMenuItemLimit('t1')).resolves.toBeUndefined();
    });

    it('treats suspended tenant as free plan', async () => {
      prisma.tenant.findUnique.mockResolvedValue({
        plan: 'pro',
        status: 'suspended',
      });
      prisma.menuItem.count.mockResolvedValue(5);

      // Pro plan has unlimited items, but suspended → treated as free → should throw at 5
      await expect(service.assertMenuItemLimit('t1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ─── assertTableLimit ──────────────────────────────────────────────────

  describe('assertTableLimit', () => {
    it('blocks creation at FREE limit (3 tables)', async () => {
      prisma.tenant.findUnique.mockResolvedValue({
        plan: 'free',
        status: 'active',
      });
      prisma.table.count.mockResolvedValue(3);

      await expect(service.assertTableLimit('t1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('allows creation under FREE limit', async () => {
      prisma.tenant.findUnique.mockResolvedValue({
        plan: 'free',
        status: 'active',
      });
      prisma.table.count.mockResolvedValue(2);

      await expect(service.assertTableLimit('t1')).resolves.toBeUndefined();
    });

    it('blocks PRO at 10 tables', async () => {
      prisma.tenant.findUnique.mockResolvedValue({
        plan: 'pro',
        status: 'active',
      });
      prisma.table.count.mockResolvedValue(10);

      await expect(service.assertTableLimit('t1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('allows ENTERPRISE unlimited tables', async () => {
      prisma.tenant.findUnique.mockResolvedValue({
        plan: 'enterprise',
        status: 'active',
      });
      prisma.table.count.mockResolvedValue(99999);

      await expect(service.assertTableLimit('t1')).resolves.toBeUndefined();
    });
  });

  // ─── assertStaffMemberLimit ────────────────────────────────────────────

  describe('assertStaffMemberLimit', () => {
    it('blocks new staff member when FREE limit reached', async () => {
      prisma.tenant.findUnique.mockResolvedValue({
        plan: 'free',
        status: 'active',
      });
      prisma.tenantMembership.count.mockResolvedValue(2); // limit is 2

      await expect(service.assertStaffMemberLimit('t1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('blocks PRO at 5 staff members', async () => {
      prisma.tenant.findUnique.mockResolvedValue({
        plan: 'pro',
        status: 'active',
      });
      prisma.tenantMembership.count.mockResolvedValue(5);

      await expect(service.assertStaffMemberLimit('t1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ─── assertMonthlyOrderLimit ───────────────────────────────────────────

  describe('assertMonthlyOrderLimit', () => {
    it('blocks order at FREE monthly limit (10)', async () => {
      prisma.tenant.findUnique.mockResolvedValue({
        plan: 'free',
        status: 'active',
      });
      prisma.order.count.mockResolvedValue(10);

      await expect(service.assertMonthlyOrderLimit('t1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('allows order under FREE monthly limit', async () => {
      prisma.tenant.findUnique.mockResolvedValue({
        plan: 'free',
        status: 'active',
      });
      prisma.order.count.mockResolvedValue(9);

      await expect(
        service.assertMonthlyOrderLimit('t1'),
      ).resolves.toBeUndefined();
    });

    it('never throws for PRO plan (unlimited orders)', async () => {
      prisma.tenant.findUnique.mockResolvedValue({
        plan: 'pro',
        status: 'active',
      });

      await expect(
        service.assertMonthlyOrderLimit('t1'),
      ).resolves.toBeUndefined();
      expect(prisma.order.count).not.toHaveBeenCalled();
    });

    it('filters orders by current month only', async () => {
      prisma.tenant.findUnique.mockResolvedValue({
        plan: 'free',
        status: 'active',
      });
      prisma.order.count.mockResolvedValue(0);

      await service.assertMonthlyOrderLimit('t1');

      const call = prisma.order.count.mock.calls[0][0];
      expect(call.where.createdAt.gte).toBeInstanceOf(Date);
      // Start of month should be day 1
      expect(call.where.createdAt.gte.getDate()).toBe(1);
      // Soft-deleted orders must not count toward the monthly quota
      expect(call.where.deletedAt).toBeNull();
    });
  });

  // ─── getUsageSummary ───────────────────────────────────────────────────

  describe('getUsageSummary', () => {
    it('returns correct usage for FREE plan', async () => {
      prisma.tenant.findUnique.mockResolvedValue({
        plan: 'free',
        status: 'active',
      });
      prisma.menuItem.count.mockResolvedValue(3);
      prisma.table.count.mockResolvedValue(2);
      prisma.tenantMembership.count.mockResolvedValue(1);
      prisma.order.count.mockResolvedValue(7);

      const summary = await service.getUsageSummary('t1');

      expect(summary.plan).toBe('free');
      expect(summary.usage.menuItems).toEqual({ current: 3, max: 5 });
      expect(summary.usage.tables).toEqual({ current: 2, max: 3 });
      expect(summary.usage.staff).toEqual({ current: 1, max: 2 });
      expect(summary.usage.monthlyOrders).toEqual({ current: 7, max: 10 });
      expect(summary.features.kds).toBe(false);
    });

    it('returns null for unlimited fields on PRO plan', async () => {
      prisma.tenant.findUnique.mockResolvedValue({
        plan: 'pro',
        status: 'active',
      });
      prisma.menuItem.count.mockResolvedValue(50);
      prisma.table.count.mockResolvedValue(8);
      prisma.tenantMembership.count.mockResolvedValue(4);
      prisma.order.count.mockResolvedValue(999);

      const summary = await service.getUsageSummary('t1');

      expect(summary.plan).toBe('pro');
      expect(summary.usage.menuItems.max).toBeNull();
      expect(summary.usage.monthlyOrders.max).toBeNull();
      expect(summary.usage.tables.max).toBe(10);
      expect(summary.features.kds).toBe(true);
    });
  });

  // ─── Plan config sanity checks ─────────────────────────────────────────

  describe('PLAN_LIMITS config', () => {
    it('FREE plan has all expected limits', () => {
      const { free } = PLAN_LIMITS;
      expect(free.maxMenuItems).toBe(5);
      expect(free.maxTables).toBe(3);
      expect(free.maxStaffMembers).toBe(2);
      expect(free.maxMonthlyOrders).toBe(10);
      expect(free.features.kds).toBe(false);
      expect(free.features.advancedReports).toBe(false);
    });

    it('PRO plan has unlimited orders and menu items', () => {
      const { pro } = PLAN_LIMITS;
      expect(pro.maxMenuItems).toBe(UNLIMITED);
      expect(pro.maxMonthlyOrders).toBe(UNLIMITED);
      expect(pro.features.kds).toBe(true);
    });

    it('ENTERPRISE plan is fully unlimited', () => {
      const { enterprise } = PLAN_LIMITS;
      expect(enterprise.maxMenuItems).toBe(UNLIMITED);
      expect(enterprise.maxTables).toBe(UNLIMITED);
      expect(enterprise.maxStaffMembers).toBe(UNLIMITED);
      expect(enterprise.maxMonthlyOrders).toBe(UNLIMITED);
      expect(enterprise.features.apiAccess).toBe(true);
    });
  });
});
