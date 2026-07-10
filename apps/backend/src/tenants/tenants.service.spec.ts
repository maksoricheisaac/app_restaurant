import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';

const TENANT = {
  id: 'tenant-1',
  name: 'Le Maquis',
  slug: 'le-maquis',
  plan: 'free',
  status: 'active',
  deletedAt: null,
};

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

      const result = await service.create({
        name: 'Le Maquis',
        slug: 'le-maquis',
      } as any);

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

      await expect(
        service.create({ name: 'T', slug: 's' } as any),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  // ─── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('excludes soft-deleted tenants by default', async () => {
      prisma.tenant.findMany.mockResolvedValue([TENANT]);
      prisma.tenant.count.mockResolvedValue(1);

      const result = await service.findAll();

      expect(result.data).toEqual([TENANT]);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        pages: 1,
      });
      const call = prisma.tenant.findMany.mock.calls[0][0];
      expect(call.where.deletedAt).toBeNull();
    });

    it('includes soft-deleted tenants when includeDeleted=true', async () => {
      prisma.tenant.findMany.mockResolvedValue([TENANT]);
      prisma.tenant.count.mockResolvedValue(1);

      await service.findAll(true);

      const call = prisma.tenant.findMany.mock.calls[0][0];
      expect(call.where.deletedAt).toBeUndefined();
    });

    it('applies pagination params', async () => {
      prisma.tenant.findMany.mockResolvedValue([TENANT]);
      prisma.tenant.count.mockResolvedValue(50);

      const result = await service.findAll(false, 2, 10);

      const call = prisma.tenant.findMany.mock.calls[0][0];
      expect(call.skip).toBe(10);
      expect(call.take).toBe(10);
      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 50,
        pages: 5,
      });
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

    it('returns null when tenant does not exist', async () => {
      prisma.tenant.findUnique.mockResolvedValue(null);
      expect(await service.findOne('missing')).toBeNull();
    });

    it('flags isDeleted=false for an active tenant', async () => {
      prisma.tenant.findUnique.mockResolvedValue(TENANT);
      const result = await service.findOne('tenant-1');
      expect(result!.isDeleted).toBe(false);
    });

    it('flags isDeleted=true for a soft-deleted tenant instead of hiding it silently', async () => {
      prisma.tenant.findUnique.mockResolvedValue({
        ...TENANT,
        deletedAt: new Date(),
      });
      const result = await service.findOne('tenant-1');
      expect(result!.isDeleted).toBe(true);
    });
  });

  // ─── findAllPublicSlugs ───────────────────────────────────────────────────

  describe('findAllPublicSlugs', () => {
    it('queries only active, non-deleted tenants, selecting slug and updatedAt', async () => {
      prisma.tenant.findMany.mockResolvedValue([
        { slug: 'le-maquis', updatedAt: new Date() },
      ]);

      await service.findAllPublicSlugs();

      const call = prisma.tenant.findMany.mock.calls[0][0];
      expect(call.where).toEqual({ deletedAt: null, status: 'active' });
      expect(call.select).toEqual({ slug: true, updatedAt: true });
    });
  });

  // ─── resolveBySlug ────────────────────────────────────────────────────────

  describe('resolveBySlug', () => {
    it('finds active, non-deleted tenant by slug', async () => {
      prisma.tenant.findFirst.mockResolvedValue(TENANT);

      await service.resolveBySlug('le-maquis');

      const call = prisma.tenant.findFirst.mock.calls[0][0];
      expect(call.where.slug).toBe('le-maquis');
      expect(call.where.status).toBe('active');
      expect(call.where.deletedAt).toBeNull();
    });

    it('returns null when slug not found', async () => {
      prisma.tenant.findFirst.mockResolvedValue(null);
      const result = await service.resolveBySlug('ghost');
      expect(result).toBeNull();
    });
  });

  // ─── remove (soft delete) ─────────────────────────────────────────────────

  describe('remove', () => {
    beforeEach(() => {
      // remove() écrit dans une transaction — router tx vers le même mock
      // que celui utilisé dans les assertions (pattern déjà en place dans
      // memberships.service.spec.ts pour transferOwnership).
      prisma.$transaction.mockImplementation((fn: any) => fn(prisma));
    });

    it('sets deletedAt instead of hard-deleting', async () => {
      prisma.tenant.findUnique.mockResolvedValue(TENANT);
      prisma.domain.deleteMany.mockResolvedValue({ count: 0 });
      prisma.tenant.update.mockResolvedValue({
        ...TENANT,
        deletedAt: new Date(),
      });

      await service.remove('tenant-1');

      const call = prisma.tenant.update.mock.calls[0][0];
      expect(call.where.id).toBe('tenant-1');
      expect(call.data.deletedAt).toBeInstanceOf(Date);
    });

    it('deletes the tenant custom domains so the domain name can be reused', async () => {
      prisma.tenant.findUnique.mockResolvedValue(TENANT);
      prisma.domain.deleteMany.mockResolvedValue({ count: 1 });
      prisma.tenant.update.mockResolvedValue({
        ...TENANT,
        deletedAt: new Date(),
      });

      await service.remove('tenant-1');

      expect(prisma.domain.deleteMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
      });
    });

    it('throws NotFoundException when tenant does not exist', async () => {
      prisma.tenant.findUnique.mockResolvedValue(null);

      await expect(service.remove('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ConflictException when tenant is already deleted', async () => {
      prisma.tenant.findUnique.mockResolvedValue({
        ...TENANT,
        deletedAt: new Date(),
      });

      await expect(service.remove('tenant-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ─── restore ──────────────────────────────────────────────────────────────

  describe('restore', () => {
    it('clears deletedAt for a soft-deleted tenant', async () => {
      prisma.tenant.findUnique.mockResolvedValue({
        ...TENANT,
        deletedAt: new Date(),
      });
      prisma.tenant.update.mockResolvedValue(TENANT);

      await service.restore('tenant-1');

      const call = prisma.tenant.update.mock.calls[0][0];
      expect(call.where.id).toBe('tenant-1');
      expect(call.data.deletedAt).toBeNull();
    });

    it('throws NotFoundException when tenant does not exist', async () => {
      prisma.tenant.findUnique.mockResolvedValue(null);

      await expect(service.restore('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ConflictException when tenant is not deleted', async () => {
      prisma.tenant.findUnique.mockResolvedValue(TENANT);

      await expect(service.restore('tenant-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
