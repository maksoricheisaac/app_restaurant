import { EventsGateway } from './events.gateway';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';

const mockJwtService = {
  verify: jest.fn(),
};

function buildSocket(
  overrides: {
    authHeader?: string;
    authToken?: string;
    userData?: Record<string, unknown>;
  } = {},
): any {
  return {
    handshake: {
      headers: { authorization: overrides.authHeader ?? undefined },
      auth: { token: overrides.authToken ?? undefined },
    },
    data: { user: overrides.userData ?? undefined },
    join: jest.fn(),
    id: 'socket-1',
  };
}

describe('EventsGateway', () => {
  let gateway: EventsGateway;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    gateway = new EventsGateway(prisma as any, mockJwtService as any);
    jest.clearAllMocks();
  });

  // ─── handleConnection ─────────────────────────────────────────────────────

  describe('handleConnection', () => {
    it('sets client.data.user from a valid Authorization header token', async () => {
      const client = buildSocket({ authHeader: 'Bearer valid.jwt.token' });
      mockJwtService.verify.mockReturnValue({
        sub: 'u1',
        email: 'a@b.com',
        role: 'owner',
        tenantId: 'tenant-1',
      });

      await gateway.handleConnection(client);

      expect(client.data.user).toEqual({
        id: 'u1',
        email: 'a@b.com',
        role: 'owner',
        tenantId: 'tenant-1',
      });
    });

    it('sets client.data.user from auth.token', async () => {
      const client = buildSocket({ authToken: 'auth.token.here' });
      mockJwtService.verify.mockReturnValue({
        sub: 'u2',
        email: 'b@c.com',
        role: 'manager',
        tenantId: 'tenant-2',
      });

      await gateway.handleConnection(client);

      expect(client.data.user.id).toBe('u2');
    });

    it('prefers Authorization header over auth.token', async () => {
      const client = buildSocket({
        authHeader: 'Bearer header.token',
        authToken: 'auth.token',
      });
      mockJwtService.verify.mockReturnValue({
        sub: 'u1',
        email: 'a@b.com',
        role: 'owner',
        tenantId: null,
      });

      await gateway.handleConnection(client);

      expect(mockJwtService.verify).toHaveBeenCalledWith('header.token');
    });

    it('leaves client.data.user undefined for invalid token (silent fail)', async () => {
      const client = buildSocket({ authHeader: 'Bearer bad.token' });
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid JWT');
      });

      await gateway.handleConnection(client);

      expect(client.data.user).toBeUndefined();
    });

    it('leaves client.data.user undefined when no token provided', async () => {
      const client = buildSocket();
      await gateway.handleConnection(client);

      expect(mockJwtService.verify).not.toHaveBeenCalled();
      expect(client.data.user).toBeUndefined();
    });
  });

  // ─── handleJoinTenant ────────────────────────────────────────────────────

  describe('handleJoinTenant', () => {
    it('returns Unauthorized when client is not authenticated', async () => {
      const client = buildSocket(); // no user

      const result = await gateway.handleJoinTenant(client, {
        tenantId: 'tenant-1',
      });

      expect(result).toEqual({ status: 'error', message: 'Unauthorized' });
      expect(client.join).not.toHaveBeenCalled();
    });

    it('returns Forbidden when user is not a member of the tenant', async () => {
      const client = buildSocket({ userData: { id: 'u1', tenantId: 'other' } });
      prisma.tenantMembership.findUnique.mockResolvedValue(null);

      const result = await gateway.handleJoinTenant(client, {
        tenantId: 'tenant-1',
      });

      expect(result).toEqual({ status: 'error', message: 'Forbidden' });
      expect(client.join).not.toHaveBeenCalled();
    });

    it('joins the correct room when membership exists', async () => {
      const client = buildSocket({
        userData: { id: 'u1', tenantId: 'tenant-1' },
      });
      prisma.tenantMembership.findUnique.mockResolvedValue({
        id: 'm1',
        role: 'owner',
      });

      const result = await gateway.handleJoinTenant(client, {
        tenantId: 'tenant-1',
      });

      expect(result).toEqual({ status: 'ok', room: 'tenant-tenant-1' });
      expect(client.join).toHaveBeenCalledWith('tenant-tenant-1');
    });

    it('verifies membership against the correct userId and tenantId', async () => {
      const client = buildSocket({
        userData: { id: 'user-uuid', tenantId: 'tenant-uuid' },
      });
      prisma.tenantMembership.findUnique.mockResolvedValue({ id: 'm1' });

      await gateway.handleJoinTenant(client, { tenantId: 'tenant-uuid' });

      expect(prisma.tenantMembership.findUnique).toHaveBeenCalledWith({
        where: {
          userId_tenantId: { userId: 'user-uuid', tenantId: 'tenant-uuid' },
        },
      });
    });
  });

  // ─── handleJoinOrder ────────────────────────────────────────────────────

  describe('handleJoinOrder', () => {
    const order = { id: 'order-1', tenantId: 'tenant-1' };

    it('returns error for missing or non-string orderId', async () => {
      const client = buildSocket();

      expect(await gateway.handleJoinOrder(client, { orderId: '' })).toEqual({
        status: 'error',
        message: 'Invalid orderId',
      });
      expect(
        await gateway.handleJoinOrder(client, { orderId: null as any }),
      ).toEqual({
        status: 'error',
        message: 'Invalid orderId',
      });
    });

    it('returns error when order not found', async () => {
      const client = buildSocket();
      prisma.order.findUnique.mockResolvedValue(null);

      const result = await gateway.handleJoinOrder(client, {
        orderId: 'ghost-order',
      });

      expect(result).toEqual({ status: 'error', message: 'Order not found' });
      expect(client.join).not.toHaveBeenCalled();
    });

    it('blocks authenticated user from joining order of a different tenant', async () => {
      const client = buildSocket({
        userData: { id: 'u1', tenantId: 'tenant-X' },
      });
      prisma.order.findUnique.mockResolvedValue({
        id: 'o1',
        tenantId: 'tenant-Y',
      });

      const result = await gateway.handleJoinOrder(client, { orderId: 'o1' });

      expect(result).toEqual({ status: 'error', message: 'Forbidden' });
    });

    it('allows authenticated user from the same tenant to join', async () => {
      const client = buildSocket({
        userData: { id: 'u1', tenantId: 'tenant-1' },
      });
      prisma.order.findUnique.mockResolvedValue(order);

      const result = await gateway.handleJoinOrder(client, {
        orderId: 'order-1',
      });

      expect(result).toEqual({ status: 'ok', room: 'order-tracking-order-1' });
      expect(client.join).toHaveBeenCalledWith('order-tracking-order-1');
    });

    it('allows unauthenticated public customer to track their own order', async () => {
      const client = buildSocket(); // no user data
      prisma.order.findUnique.mockResolvedValue(order);

      const result = await gateway.handleJoinOrder(client, {
        orderId: 'order-1',
      });

      expect(result).toEqual({ status: 'ok', room: 'order-tracking-order-1' });
    });

    it('checks membership for authenticated user without tenantId claim', async () => {
      const client = buildSocket({
        userData: { id: 'u1', tenantId: undefined },
      });
      prisma.order.findUnique.mockResolvedValue(order);
      prisma.tenantMembership.findFirst.mockResolvedValue(null); // not a member

      const result = await gateway.handleJoinOrder(client, {
        orderId: 'order-1',
      });

      expect(result).toEqual({ status: 'error', message: 'Forbidden' });
    });

    it('allows user with no tenantId claim if membership exists', async () => {
      const client = buildSocket({
        userData: { id: 'u1', tenantId: undefined },
      });
      prisma.order.findUnique.mockResolvedValue(order);
      prisma.tenantMembership.findFirst.mockResolvedValue({ id: 'm1' });

      const result = await gateway.handleJoinOrder(client, {
        orderId: 'order-1',
      });

      expect(result.status).toBe('ok');
    });
  });

  // ─── handleDisconnect ────────────────────────────────────────────────────

  describe('handleDisconnect', () => {
    it('is a no-op that does not throw', () => {
      const client = buildSocket();
      expect(() => gateway.handleDisconnect(client)).not.toThrow();
    });
  });
});
