import { AuditService } from './audit.service';
import { createMockPrisma, MockPrisma } from '../../__tests__/prisma.mock';
import { matchAuditRule } from '../middleware/audit.middleware';

describe('AuditService', () => {
  let service: AuditService;
  let prisma: MockPrisma;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new AuditService(prisma as any);
    jest.clearAllMocks();
    prisma.auditLog.create.mockResolvedValue({ id: 'log-1' });
  });

  const written = () => prisma.auditLog.create.mock.calls[0][0].data;

  it('consigne un fait avec son acteur et sa cible', async () => {
    await service.record({
      action: 'payment.recorded',
      entity: 'payment',
      entityId: 'pay-1',
      userId: 'user-1',
      userEmail: 'caisse@resto.fr',
      userRole: 'cashier',
      statusCode: 201,
    });

    expect(written()).toMatchObject({
      action: 'payment.recorded',
      entity: 'payment',
      entityId: 'pay-1',
      userId: 'user-1',
      userEmail: 'caisse@resto.fr',
      userRole: 'cashier',
      statusCode: 201,
    });
  });

  it('masque les secrets présents dans le corps consigné', async () => {
    await service.record({
      action: 'auth.login',
      after: {
        email: 'chef@resto.fr',
        password: 'motdepasse-en-clair',
        nested: { refreshToken: 'abc', keep: 'visible' },
      },
    });

    const after = written().after;
    expect(after.password).toBe('[masqué]');
    expect(after.nested.refreshToken).toBe('[masqué]');
    expect(after.email).toBe('chef@resto.fr');
    expect(after.nested.keep).toBe('visible');
  });

  it('tronque une charge utile démesurée au lieu de la stocker entière', async () => {
    await service.record({
      action: 'menu.update',
      after: { description: 'x'.repeat(10_000) },
    });

    const after = written().after;
    expect(after._truncated).toBe(true);
    expect(after._originalLength).toBeGreaterThan(4000);
  });

  it('laisse la colonne vide quand il n’y a rien à consigner', async () => {
    await service.record({ action: 'auth.logout' });

    expect(written().before).toBeUndefined();
    expect(written().after).toBeUndefined();
  });

  it('n’interrompt jamais l’opération tracée quand l’écriture échoue', async () => {
    prisma.auditLog.create.mockRejectedValue(new Error('base indisponible'));

    await expect(
      service.record({ action: 'payment.recorded' }),
    ).resolves.toBeUndefined();
  });
});

/**
 * Cette suite existe à cause d'un défaut réel : le middleware surveillait
 * `/cash-register/payment` alors que la route est `/cash-register/pay`, si
 * bien qu'aucun encaissement n'était journalisé. Un chemin faux ne se voit
 * pas — il se traduit seulement par une absence.
 *
 * Les chemins sont donc écrits ici tels qu'Express les voit réellement,
 * préfixe global compris (`/api/v1/…`, posé dans `main.ts`) : c'est la seule
 * façon que ces tests protègent quelque chose.
 */
describe('règles d’audit — routes réellement couvertes', () => {
  const ORDER_ID = '6f1c2f7e-1b3a-4c2d-9e8f-0a1b2c3d4e5f';

  it.each([
    ['POST', '/api/v1/cash-register/pay', 'payment.process'],
    ['POST', '/api/v1/cash-register/session/open', 'cash_session.open'],
    ['POST', '/api/v1/cash-register/session/close', 'cash_session.close'],
    ['POST', '/api/v1/orders', 'order.create'],
    ['PATCH', `/api/v1/orders/${ORDER_ID}/status`, 'order.update_status'],
    ['DELETE', `/api/v1/orders/${ORDER_ID}`, 'order.delete'],
    ['POST', '/api/v1/public-menu/order', 'order.create_public'],
    ['POST', '/api/v1/auth/login', 'auth.login'],
    ['POST', '/api/v1/staff/invites', 'staff.invite'],
    ['PATCH', '/api/v1/staff/transfer-ownership', 'staff.transfer_ownership'],
    ['PATCH', '/api/v1/restaurant/cash', 'restaurant.update'],
    ['POST', '/api/v1/inventory/movements', 'stock.movement'],
    ['PATCH', `/api/v1/menu/${ORDER_ID}`, 'menu.update'],
  ])('%s %s est consigné comme « %s »', (method, path, action) => {
    expect(matchAuditRule(method, path)?.action).toBe(action);
  });

  it('reste opérant si le préfixe de version change', () => {
    expect(matchAuditRule('POST', '/api/v2/cash-register/pay')?.action).toBe(
      'payment.process',
    );
  });

  it('reste opérant sans préfixe (appel monté à la racine)', () => {
    expect(matchAuditRule('POST', '/cash-register/pay')?.action).toBe(
      'payment.process',
    );
  });

  it('ne consigne pas les lectures', () => {
    expect(matchAuditRule('GET', '/api/v1/orders')).toBeUndefined();
    expect(
      matchAuditRule('GET', '/api/v1/cash-register/transactions'),
    ).toBeUndefined();
  });

  it('rattache le changement de statut à la commande visée', () => {
    const rule = matchAuditRule('PATCH', `/api/v1/orders/${ORDER_ID}/status`);
    expect(rule?.entity).toBe('order');
  });
});
