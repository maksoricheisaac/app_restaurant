import { HealthController } from './health.controller';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';

describe('HealthController', () => {
  let controller: HealthController;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    controller = new HealthController(prisma as any);
  });

  describe('live', () => {
    it('always returns ok with uptime', () => {
      const result = controller.live();
      expect(result.status).toBe('ok');
      expect(typeof result.uptime).toBe('number');
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('ready', () => {
    it('returns ok when DB is reachable', async () => {
      prisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);

      const result = await controller.ready();
      expect(result.status).toBe('ok');
    });

    it('throws when DB is unreachable', async () => {
      prisma.$queryRaw.mockRejectedValue(new Error('Connection refused'));

      await expect(controller.ready()).rejects.toThrow('Connection refused');
    });
  });

  describe('health', () => {
    it('returns healthy status when DB responds', async () => {
      prisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);

      const result = await controller.health();
      expect(result.status).toBe('ok');
      expect(result.checks.database.status).toBe('ok');
      expect(typeof result.checks.database.latencyMs).toBe('number');
      expect(result.checks.memory.heapUsedMb).toBeGreaterThan(0);
      expect(result.checks.process.status).toBe('ok');
    });

    it('returns degraded status when DB fails', async () => {
      prisma.$queryRaw.mockRejectedValue(new Error('DB down'));

      const result = await controller.health();
      expect(result.status).toBe('degraded');
      expect(result.checks.database.status).toBe('error');
      expect(result.checks.database.latencyMs).toBeNull();
    });

    it('includes timestamp in ISO format', async () => {
      prisma.$queryRaw.mockResolvedValue([]);
      const result = await controller.health();
      expect(() => new Date(result.timestamp)).not.toThrow();
    });
  });
});
