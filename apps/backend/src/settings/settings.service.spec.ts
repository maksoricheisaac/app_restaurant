import { SettingsService } from './settings.service';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';

const T = 'tenant-1';
const SETTINGS = { id: 'set-1', tenantId: T, name: 'Mon Restaurant' };

function buildService(prisma: any) {
  (prisma as any).restaurantSettings = {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  (prisma as any).openingHours = {
    findMany: jest.fn().mockResolvedValue([]),
    upsert: jest.fn().mockResolvedValue({}),
  };
  return new SettingsService(prisma);
}

describe('SettingsService', () => {
  let service: SettingsService;
  let prisma: any;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = buildService(prisma);
    jest.clearAllMocks();
  });

  // ─── findByTenant ─────────────────────────────────────────────────────────

  describe('findByTenant', () => {
    it('returns existing settings when found', async () => {
      prisma.restaurantSettings.findUnique.mockResolvedValue(SETTINGS);

      const result = await service.findByTenant(T);
      expect(result).toEqual(SETTINGS);
      expect(prisma.restaurantSettings.create).not.toHaveBeenCalled();
    });

    it('creates default settings when none exist', async () => {
      prisma.restaurantSettings.findUnique.mockResolvedValue(null);
      prisma.restaurantSettings.create.mockResolvedValue(SETTINGS);

      const result = await service.findByTenant(T);

      expect(prisma.restaurantSettings.create).toHaveBeenCalled();
      const call = prisma.restaurantSettings.create.mock.calls[0][0];
      expect(call.data.tenantId).toBe(T);
      expect(result).toEqual(SETTINGS);
    });

    it('queries settings by tenantId', async () => {
      prisma.restaurantSettings.findUnique.mockResolvedValue(SETTINGS);

      await service.findByTenant(T);

      const call = prisma.restaurantSettings.findUnique.mock.calls[0][0];
      expect(call.where.tenantId).toBe(T);
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('updates settings for the correct tenant', async () => {
      prisma.restaurantSettings.update.mockResolvedValue({
        ...SETTINGS,
        name: 'Nouveau Nom',
      });

      await service.update(T, { name: 'Nouveau Nom' } as any);

      const call = prisma.restaurantSettings.update.mock.calls[0][0];
      expect(call.where.tenantId).toBe(T);
      expect(call.data.name).toBe('Nouveau Nom');
    });
  });

  // ─── findOpeningHours ─────────────────────────────────────────────────────

  describe('findOpeningHours', () => {
    it('returns opening hours for the tenant', async () => {
      const hours = [
        {
          tenantId: T,
          dayOfWeek: 'MONDAY',
          openTime: '09:00',
          closeTime: '22:00',
          isClosed: false,
        },
      ];
      prisma.openingHours.findMany.mockResolvedValue(hours);

      const result = await service.findOpeningHours(T);

      const call = prisma.openingHours.findMany.mock.calls[0][0];
      expect(call.where.tenantId).toBe(T);
      expect(result).toEqual(hours);
    });
  });
});
