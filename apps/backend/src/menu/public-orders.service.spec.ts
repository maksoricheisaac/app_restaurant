import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PublicOrderService } from './public-orders.service';

// Passe toujours en test (reflète le comportement en développement)
const mockMenuSessionService = { verify: jest.fn().mockReturnValue(true) };
const mockOrderCreation = { create: jest.fn() };

const RESTAURANT = {
  name: 'Le Maquis',
  dineInEnabled: true,
  takeawayEnabled: true,
  deliveryEnabled: true,
};
const mockRestaurantService = {
  getPublicProfile: jest.fn().mockResolvedValue(RESTAURANT),
};

/**
 * Adaptateur du canal public. Le métier (prix, options, livraison, stock)
 * est couvert par order-creation.service.spec.ts ; ce fichier ne vérifie que
 * ce qui est propre au parcours client — jeton de session et ouverture du
 * mode de service.
 */
describe('PublicOrderService', () => {
  let service: PublicOrderService;

  beforeEach(() => {
    service = new PublicOrderService(
      mockMenuSessionService as any,
      mockRestaurantService as any,
      mockOrderCreation as any,
    );
    jest.clearAllMocks();
    mockMenuSessionService.verify.mockReturnValue(true);
    mockRestaurantService.getPublicProfile.mockResolvedValue(RESTAURANT);
    mockOrderCreation.create.mockResolvedValue({
      id: 'o1',
      status: 'pending',
      total: 2500,
    });
  });

  const dto = (overrides: Record<string, unknown> = {}) =>
    ({
      type: 'dine_in',
      items: [{ menuItemId: 'item-1', quantity: 1 }],
      ...overrides,
    }) as any;

  // ─── Jeton de session de menu ─────────────────────────────────────────────

  it('refuse une commande sans jeton de session valide', async () => {
    mockMenuSessionService.verify.mockReturnValue(false);

    await expect(service.createOrder(dto(), 'périmé')).rejects.toThrow(
      ForbiddenException,
    );
    expect(mockOrderCreation.create).not.toHaveBeenCalled();
  });

  // ─── Mode de service ──────────────────────────────────────────────────────

  it('refuse un mode de service fermé par le restaurant', async () => {
    mockRestaurantService.getPublicProfile.mockResolvedValue({
      ...RESTAURANT,
      deliveryEnabled: false,
    });

    await expect(
      service.createOrder(dto({ type: 'delivery', deliveryZoneId: 'z1' })),
    ).rejects.toThrow(BadRequestException);
    expect(mockOrderCreation.create).not.toHaveBeenCalled();
  });

  it('accepte un mode de service ouvert', async () => {
    await service.createOrder(dto({ type: 'takeaway' }));

    expect(mockOrderCreation.create).toHaveBeenCalled();
  });

  // ─── Délégation ───────────────────────────────────────────────────────────

  it('délègue au chemin unique de création avec le canal public', async () => {
    await service.createOrder(
      dto({
        items: [
          {
            menuItemId: 'item-1',
            quantity: 2,
            selectedOptionIds: ['opt-a'],
          },
        ],
        specialNotes: 'Sans oignon',
        customerName: 'Awa',
      }),
    );

    expect(mockOrderCreation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'public',
        type: 'dine_in',
        specialNotes: 'Sans oignon',
        customerName: 'Awa',
        items: [
          {
            menuItemId: 'item-1',
            quantity: 2,
            selectedOptionIds: ['opt-a'],
          },
        ],
      }),
    );
  });

  it('ne transmet jamais d’identité d’employé', async () => {
    await service.createOrder(dto());

    expect(mockOrderCreation.create.mock.calls[0][0].userId).toBeUndefined();
  });

  it('renvoie l’identifiant de suivi au client', async () => {
    const result = await service.createOrder(dto());

    expect(result).toEqual({ orderId: 'o1', status: 'pending', total: 2500 });
  });
});
