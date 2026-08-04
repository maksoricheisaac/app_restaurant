import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderTicketService } from './order-ticket.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

const mockOrdersService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  updateStatus: jest.fn(),
  remove: jest.fn(),
  findKitchenOrders: jest.fn(),
  getTracking: jest.fn(),
};

const mockTicketService = {
  findOpen: jest.fn(),
  addLines: jest.fn(),
  updateDraftLineQuantity: jest.fn(),
  removeDraftLine: jest.fn(),
  voidLine: jest.fn(),
  sendToKitchen: jest.fn(),
  advanceLine: jest.fn(),
};

const mockUser = { id: 'user-1', role: 'owner' };

describe('OrdersController', () => {
  let controller: OrdersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        { provide: OrdersService, useValue: mockOrdersService },
        { provide: OrderTicketService, useValue: mockTicketService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<OrdersController>(OrdersController);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('transmet les filtres au service', async () => {
      const filters: any = { status: 'pending', page: 1, limit: 10 };
      mockOrdersService.findAll.mockResolvedValue({ data: [] });

      await controller.findAll(filters);

      expect(mockOrdersService.findAll).toHaveBeenCalledWith(filters);
    });
  });

  describe('create', () => {
    it("transmet la commande et l'identifiant de l'opérateur", async () => {
      const dto: any = { type: 'dine_in', items: [] };
      const created = { id: 'order-1' };
      mockOrdersService.create.mockResolvedValue(created);

      const result = await controller.create(dto, mockUser);

      expect(mockOrdersService.create).toHaveBeenCalledWith(dto, mockUser.id);
      expect(result).toBe(created);
    });
  });

  describe('updateStatus', () => {
    it('met à jour le statut de la commande', async () => {
      const dto: any = { status: 'preparing' };
      const updated = { id: 'order-1', status: 'preparing' };
      mockOrdersService.updateStatus.mockResolvedValue(updated);

      const result = await controller.updateStatus('order-1', dto, mockUser);

      // L'acteur est transmis au service : c'est lui qui alimente l'auteur
      // de l'entrée d'audit du changement de statut.
      expect(mockOrdersService.updateStatus).toHaveBeenCalledWith(
        'order-1',
        dto,
        mockUser,
      );
      expect(result).toBe(updated);
    });
  });

  describe('remove', () => {
    it('supprime logiquement la commande', async () => {
      const deleted = { id: 'order-1', deletedAt: new Date() };
      mockOrdersService.remove.mockResolvedValue(deleted);

      const result = await controller.remove('order-1');

      expect(mockOrdersService.remove).toHaveBeenCalledWith('order-1');
      expect(result).toBe(deleted);
    });
  });

  describe('getKitchenOrders', () => {
    it("renvoie les commandes actives sans contrôle d'abonnement", async () => {
      mockOrdersService.findKitchenOrders.mockResolvedValue([]);

      const result = await controller.getKitchenOrders();

      expect(mockOrdersService.findKitchenOrders).toHaveBeenCalledWith();
      expect(result).toEqual([]);
    });
  });

  describe('getTracking', () => {
    it('expose le suivi public par identifiant de commande', async () => {
      const tracking = {
        id: 'order-1',
        status: 'preparing',
        createdAt: new Date(),
      };
      mockOrdersService.getTracking.mockResolvedValue(tracking);

      const result = await controller.getTracking('order-1');

      expect(mockOrdersService.getTracking).toHaveBeenCalledWith('order-1');
      expect(result).toBe(tracking);
    });
  });
});
