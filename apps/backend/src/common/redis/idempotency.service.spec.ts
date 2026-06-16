import { IdempotencyService } from './idempotency.service';
import { RedisService } from './redis.service';

describe('IdempotencyService', () => {
  describe('without Redis (in-memory fallback)', () => {
    let service: IdempotencyService;

    beforeEach(() => {
      const redisService = { getClient: () => null } as unknown as RedisService;
      service = new IdempotencyService(redisService);
    });

    it('returns true the first time a key is seen', async () => {
      await expect(service.checkAndMark('event-1', 60)).resolves.toBe(true);
    });

    it('returns false for a duplicate key within the TTL', async () => {
      await service.checkAndMark('event-1', 60);
      await expect(service.checkAndMark('event-1', 60)).resolves.toBe(false);
    });

    it('evicts expired keys and allows reprocessing after TTL', async () => {
      await service.checkAndMark('event-1', -1); // already expired
      await expect(service.checkAndMark('event-1', 60)).resolves.toBe(true);
    });
  });

  describe('with Redis configured', () => {
    function buildService(set: jest.Mock) {
      const redisService = {
        getClient: () => ({ set }),
      } as unknown as RedisService;
      return new IdempotencyService(redisService);
    }

    it('returns true when Redis SETNX succeeds (key was new)', async () => {
      const set = jest.fn().mockResolvedValue('OK');
      const service = buildService(set);

      await expect(service.checkAndMark('event-1', 60)).resolves.toBe(true);
      expect(set).toHaveBeenCalledWith('event-1', '1', 'EX', 60, 'NX');
    });

    it('returns false when Redis SETNX fails (key already exists)', async () => {
      const set = jest.fn().mockResolvedValue(null);
      const service = buildService(set);

      await expect(service.checkAndMark('event-1', 60)).resolves.toBe(false);
    });

    it('falls back to in-memory when Redis throws', async () => {
      const set = jest.fn().mockRejectedValue(new Error('connection lost'));
      const service = buildService(set);

      await expect(service.checkAndMark('event-1', 60)).resolves.toBe(true);
      await expect(service.checkAndMark('event-1', 60)).resolves.toBe(false);
    });
  });
});
