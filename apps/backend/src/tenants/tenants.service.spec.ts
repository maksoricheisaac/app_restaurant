import { InternalServerErrorException } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';

const TENANT = { id: 'tenant-1', name: 'Le Maquis', slug: 'le-maquis', plan: 'free', status: 'active' };

describe('TenantsService', () => {
  let service: TenantsService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new TenantsService(prisma as any);
    jest.clearAllMocks();
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates tenant with correct data', async () => {
      prisma.tenant.create.mockResolvedValue(TENANT);

      const result = await service.create({ name: 'Le Maquis', slug: 'le-maquis' } as any);

      expect(result).toEqual(TENANT);
      const call = prisma.tenant.create.mock.calls[0][0];
      expect(call.data.name).toBe('Le Maquis');
      expect(call.data.slug).toBe('le-maquis');
    });

    it('defaults plan to free when not specified', async () => {
      prisma.tenant.create.mockResolvedValue(TENANT);

      await service.create({ name: 'T', slug: 's' } as any);

      const call = prisma.tenant.create.mock.calls[0][0];
      expect(call.data.plan).toBe('free');
    });

    it('sets status to active on creation', async () => {
      prisma.tenant.create.mockResolvedValue(TENANT);

      await service.create({ name: 'T', slug: 's' } as any);

      const call = prisma.tenant.create.mock.calls[0][0];
      expect(call.data.status).toBe('active');
    });

    it('wraps DB errors in InternalServerErrorException', async () => {
      prisma.tenant.create.mockRejectedValue(new Error('DB constraint'));

      await expect(service.create({ name: 'T', slug: 's' } as any)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  // ─── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns all tenants without filter', async () => {
      prisma.tenant.findMany.mockResolvedValue([TENANT]);
      const result = await service.findAll();
      expect(result).toEqual([TENANT]);
    });
  });

  // ─── findOne ──────────────────────────────────────────────────────────────

  describe('findOne', () => {
    it('queries by id with memberships', async () => {
      prisma.tenant.findUnique.mockResolvedValue(TENANT);

      await service.findOne('tenant-1');

      const call = prisma.tenant.findUnique.mock.calls[0][0];
      expect(call.where.id).toBe('tenant-1');
      expect(call.include.memberships).toBeDefined();
    });
  });

  // ─── resolveBySlug ────────────────────────────────────────────────────────

  describe('resolveBySlug', () => {
    it('finds active tenant by slug', async () => {
      prisma.tenant.findFirst.mockResolvedValue(TENANT);

      await service.resolveBySlug('le-maquis');

      const call = prisma.tenant.findFirst.mock.calls[0][0];
      expect(call.where.slug).toBe('le-maquis');
      expect(call.where.status).toBe('active');
    });

    it('returns null when slug not found', async () => {
      prisma.tenant.findFirst.mockResolvedValue(null);
      const result = await service.resolveBySlug('ghost');
      expect(result).toBeNull();
    });
  });

  // ─── remove (soft suspend) ────────────────────────────────────────────────

  describe('remove', () => {
    it('sets status to suspended instead of hard-deleting', async () => {
      prisma.tenant.update.mockResolvedValue({ ...TENANT, status: 'suspended' });

      await service.remove('tenant-1');

      const call = prisma.tenant.update.mock.calls[0][0];
      expect(call.where.id).toBe('tenant-1');
      expect(call.data.status).toBe('suspended');
    });
  });
});
