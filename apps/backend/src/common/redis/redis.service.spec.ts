import { RedisService } from './redis.service';

const onMock = jest.fn();
const quitMock = jest.fn().mockResolvedValue('OK');

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    on: onMock,
    quit: quitMock,
  }));
});

function buildConfig(redisUrl?: string) {
  return { get: jest.fn().mockReturnValue(redisUrl) } as any;
}

describe('RedisService', () => {
  afterEach(() => jest.clearAllMocks());

  it('getClient() returns null when REDIS_URL is not set', () => {
    const service = new RedisService(buildConfig(undefined));
    expect(service.getClient()).toBeNull();
  });

  it('getClient() returns an ioredis client when REDIS_URL is set', () => {
    const service = new RedisService(buildConfig('redis://localhost:6379'));
    expect(service.getClient()).not.toBeNull();
    expect(onMock).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('onModuleDestroy() quits the client when configured', async () => {
    const service = new RedisService(buildConfig('redis://localhost:6379'));
    await service.onModuleDestroy();
    expect(quitMock).toHaveBeenCalled();
  });

  it('onModuleDestroy() is a no-op when not configured', async () => {
    const service = new RedisService(buildConfig(undefined));
    await expect(service.onModuleDestroy()).resolves.toBeUndefined();
    expect(quitMock).not.toHaveBeenCalled();
  });
});
