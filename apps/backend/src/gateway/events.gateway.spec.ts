import { EventsGateway } from './events.gateway';
import { STAFF_ROOM } from './events.service';
import { createMockPrisma, MockPrisma } from '../__tests__/prisma.mock';

const mockJwtService = {
  verify: jest.fn(),
};

const ACTIVE_ACCOUNT = {
  id: 'u1',
  email: 'a@b.com',
  role: 'owner',
  status: 'active',
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
    it('charge le compte et rejoint le salon du personnel avec un jeton valide', async () => {
      const client = buildSocket({ authHeader: 'Bearer valid.jwt.token' });
      mockJwtService.verify.mockReturnValue({ sub: 'u1', email: 'a@b.com' });
      prisma.user.findUnique.mockResolvedValue(ACTIVE_ACCOUNT);

      await gateway.handleConnection(client);

      expect(client.data.user).toEqual(ACTIVE_ACCOUNT);
      expect(client.join).toHaveBeenCalledWith(STAFF_ROOM);
    });

    it('accepte le jeton passé dans auth.token', async () => {
      const client = buildSocket({ authToken: 'auth.token.here' });
      mockJwtService.verify.mockReturnValue({ sub: 'u2', email: 'b@c.com' });
      prisma.user.findUnique.mockResolvedValue({
        ...ACTIVE_ACCOUNT,
        id: 'u2',
        role: 'manager',
      });

      await gateway.handleConnection(client);

      expect(client.data.user.id).toBe('u2');
    });

    it("privilégie l'en-tête Authorization sur auth.token", async () => {
      const client = buildSocket({
        authHeader: 'Bearer header.token',
        authToken: 'auth.token',
      });
      mockJwtService.verify.mockReturnValue({ sub: 'u1', email: 'a@b.com' });
      prisma.user.findUnique.mockResolvedValue(ACTIVE_ACCOUNT);

      await gateway.handleConnection(client);

      expect(mockJwtService.verify).toHaveBeenCalledWith('header.token');
    });

    it('refuse le salon du personnel à un compte désactivé', async () => {
      const client = buildSocket({ authHeader: 'Bearer valid.jwt.token' });
      mockJwtService.verify.mockReturnValue({ sub: 'u1', email: 'a@b.com' });
      prisma.user.findUnique.mockResolvedValue({
        ...ACTIVE_ACCOUNT,
        status: 'banned',
      });

      await gateway.handleConnection(client);

      expect(client.data.user).toBeUndefined();
      expect(client.join).not.toHaveBeenCalled();
    });

    it('laisse le client anonyme sur un jeton invalide (échec silencieux)', async () => {
      const client = buildSocket({ authHeader: 'Bearer bad.token' });
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid JWT');
      });

      await gateway.handleConnection(client);

      expect(client.data.user).toBeUndefined();
      expect(client.join).not.toHaveBeenCalled();
    });

    it('laisse le client anonyme en absence de jeton', async () => {
      const client = buildSocket();

      await gateway.handleConnection(client);

      expect(mockJwtService.verify).not.toHaveBeenCalled();
      expect(client.data.user).toBeUndefined();
    });
  });

  // ─── handleJoinOrder ─────────────────────────────────────────────────────

  describe('handleJoinOrder', () => {
    const order = { id: 'order-1' };

    it('rejette un orderId manquant ou non textuel', async () => {
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

    it('rejette une commande inexistante', async () => {
      const client = buildSocket();
      prisma.order.findUnique.mockResolvedValue(null);

      const result = await gateway.handleJoinOrder(client, {
        orderId: 'ghost-order',
      });

      expect(result).toEqual({ status: 'error', message: 'Order not found' });
      expect(client.join).not.toHaveBeenCalled();
    });

    it('laisse un client anonyme suivre sa propre commande', async () => {
      const client = buildSocket(); // aucun utilisateur authentifié
      prisma.order.findUnique.mockResolvedValue(order);

      const result = await gateway.handleJoinOrder(client, {
        orderId: 'order-1',
      });

      expect(result).toEqual({ status: 'ok', room: 'order-tracking-order-1' });
      expect(client.join).toHaveBeenCalledWith('order-tracking-order-1');
    });
  });

  // ─── handleDisconnect ────────────────────────────────────────────────────

  describe('handleDisconnect', () => {
    it('ne lève pas', () => {
      const client = buildSocket();
      expect(() => gateway.handleDisconnect(client)).not.toThrow();
    });
  });
});
