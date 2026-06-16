import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';

const mockOrdersService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  updateStatus: jest.fn(),
  remove: jest.fn(),
  findKitchenOrders: jest.fn(),
  getTracking: jest.fn(),
};

const mockFeatureFlags = {
  assertPlanFeature: jest.fn(),
};

const mockTenant = { id: 'tenant-1', plan: 'pro' };
const mockUser = { id: 'user-1', platformRole: 'user' };

describe('OrdersController', () => {
  let controller: OrdersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        { provide: OrdersService, useValue: mockOrdersService },
        { provide: FeatureFlagsService, useValue: mockFeatureFlags },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(TenantGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<OrdersController>(OrdersController);
    jest.clearAllMocks();
  });

  // ─── findAll ────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('delegates to ordersService.findAll with tenant id', async () => {
      const pagination = {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 },
      };
      mockOrdersService.findAll.mockResolvedValue(pagination);
      const filters: any = { page: 1, limit: 10 };

      const result = await controller.findAll(mockTenant as any, filters);

      expect(mockOrdersService.findAll).toHaveBeenCalledWith(
        'tenant-1',
        filters,
      );
      expect(result).toBe(pagination);
    });
  });

  // ─── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates an order with tenant and user context', async () => {
      const dto: any = { type: 'dine_in', items: [] };
      const created = { id: 'order-1', tenantId: 'tenant-1' };
      mockOrdersService.create.mockResolvedValue(created);

      const result = await controller.create(mockTenant as any, dto, mockUser);

      expect(mockOrdersService.create).toHaveBeenCalledWith(
        'tenant-1',
        dto,
        'user-1',
      );
      expect(result).toBe(created);
    });
  });

  // ─── updateStatus ───────────────────────────────────────────────────────────

  describe('updateStatus', () => {
    it('updates order status', async () => {
      const dto: any = { status: 'preparing' };
      const updated = { id: 'order-1', status: 'preparing' };
      mockOrdersService.updateStatus.mockResolvedValue(updated);

      const result = await controller.updateStatus(
        mockTenant as any,
        'order-1',
        dto,
      );

      expect(mockOrdersService.updateStatus).toHaveBeenCalledWith(
        'tenant-1',
        'order-1',
        dto,
      );
      expect(result).toBe(updated);
    });
  });

  // ─── remove ─────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('soft-deletes the order', async () => {
      const deleted = { id: 'order-1', deletedAt: new Date() };
      mockOrdersService.remove.mockResolvedValue(deleted);

      const result = await controller.remove(mockTenant as any, 'order-1');

      expect(mockOrdersService.remove).toHaveBeenCalledWith(
        'tenant-1',
        'order-1',
      );
      expect(result).toBe(deleted);
    });
  });

  // ─── getKitchenOrders ───────────────────────────────────────────────────────

  describe('getKitchenOrders', () => {
    it('checks KDS feature flag before returning orders', async () => {
      mockFeatureFlags.assertPlanFeature.mockResolvedValue(undefined);
      mockOrdersService.findKitchenOrders.mockResolvedValue([]);

      const result = await controller.getKitchenOrders(mockTenant as any);

      expect(mockFeatureFlags.assertPlanFeature).toHaveBeenCalledWith(
        'tenant-1',
        'kds',
      );
      expect(mockOrdersService.findKitchenOrders).toHaveBeenCalledWith(
        'tenant-1',
      );
      expect(result).toEqual([]);
    });

    it('throws when KDS feature is not available on the plan', async () => {
      mockFeatureFlags.assertPlanFeature.mockRejectedValue(
        new ForbiddenException('KDS not available'),
      );
      await expect(
        controller.getKitchenOrders(mockTenant as any),
      ).rejects.toThrow(ForbiddenException);
      expect(mockOrdersService.findKitchenOrders).not.toHaveBeenCalled();
    });
  });

  // ─── getTracking (public) ────────────────────────────────────────────────────

  describe('getTracking', () => {
    it('returns order tracking data without authentication', async () => {
      const tracking = {
        id: 'order-1',
        status: 'preparing',
        createdAt: new Date(),
      };
      mockOrdersService.getTracking.mockResolvedValue(tracking);

      const result = await controller.getTracking('order-1');

      expect(mockOrdersService.getTracking).toHaveBeenCalledWith('order-1');
      expect(result).toBe(tracking);
    });
  });
});
