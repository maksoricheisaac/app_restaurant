import { RedisIoAdapter } from './redis-io.adapter';

const onMock = jest.fn();
const duplicateMock = jest.fn();

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    on: onMock,
    duplicate: duplicateMock,
  }));
});

jest.mock('@socket.io/redis-adapter', () => ({
  createAdapter: jest.fn().mockReturnValue('redis-adapter'),
}));

describe('RedisIoAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    duplicateMock.mockReturnValue({ on: onMock });
  });

  it('does not configure a Redis adapter when redisUrl is absent', () => {
    const adapter = new RedisIoAdapter({} as any, undefined);
    adapter.connectToRedis();

    const server: any = { adapter: jest.fn() };
    jest
      .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(adapter)), 'createIOServer')
      .mockReturnValue(server);

    adapter.createIOServer(0);
    expect(server.adapter).not.toHaveBeenCalled();
  });

  it('configures the Redis adapter when redisUrl is set', () => {
    const adapter = new RedisIoAdapter({} as any, 'redis://localhost:6379');
    adapter.connectToRedis();

    const server: any = { adapter: jest.fn() };
    jest
      .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(adapter)), 'createIOServer')
      .mockReturnValue(server);

    adapter.createIOServer(0);
    expect(server.adapter).toHaveBeenCalledWith('redis-adapter');
  });
});
