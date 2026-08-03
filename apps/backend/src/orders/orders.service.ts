import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../gateway/events.service';
import { CustomersService } from '../customers/customers.service';
import { InventoryService } from '../inventory/inventory.service';
import { RESTAURANT_ID } from '../restaurant/restaurant.constants';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderFiltersDto } from './dto/order-filters.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

// Transitions d'état autorisées pour les commandes (machine d'état stricte)
const VALID_ORDER_TRANSITIONS: Record<string, string[]> = {
  pending: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['served', 'cancelled'],
  served: [], // état terminal — géré par le module caisse (payment)
  cancelled: [], // état terminal
};

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private eventsService: EventsService,
    private customersService: CustomersService,
    private inventoryService: InventoryService,
  ) {}

  async findAll(filters: OrderFiltersDto) {
    const { status, type, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * Math.min(limit, 100);
    const take = Math.min(limit, 100);

    const where = {
      deletedAt: null, // exclure les soft-deleted
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          orderItems: true,
          table: true,
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit: take,
        total,
        pages: Math.ceil(total / take),
      },
    };
  }

  findOne(id: string) {
    return this.prisma.order.findFirst({
      where: { id, deletedAt: null },
      include: {
        orderItems: true,
        table: true,
        payment: true,
        user: { select: { name: true, email: true } },
      },
    });
  }

  async create(data: CreateOrderDto, userId?: string) {
    const { items, customerName, customerEmail, customerPhone, ...orderData } =
      data;

    // Rapproche ou crée la fiche client à partir des coordonnées saisies
    let resolvedCustomerId = data.customerId ?? null;
    if (
      !resolvedCustomerId &&
      (customerName || customerEmail || customerPhone)
    ) {
      resolvedCustomerId = await this.customersService.upsertFromInteraction({
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
      });
    }

    // Les prix sont TOUJOURS relus en base pour les articles de la carte —
    // le prix envoyé par le client n'est jamais cru sur parole.
    const menuItemIds = items
      .filter((i) => i.menuItemId)
      .map((i) => i.menuItemId!);
    const dbMenuItems =
      menuItemIds.length > 0
        ? await this.prisma.menuItem.findMany({
            where: { id: { in: menuItemIds }, deletedAt: null },
            select: { id: true, name: true, price: true, image: true },
          })
        : [];

    const priceMap = new Map(dbMenuItems.map((m) => [m.id, m]));

    for (const item of items) {
      if (item.menuItemId && !priceMap.has(item.menuItemId)) {
        throw new BadRequestException(
          `Article inconnu ou indisponible : ${item.menuItemId}`,
        );
      }
    }

    const sanitizedItems = items.map((item) => {
      const db = item.menuItemId ? priceMap.get(item.menuItemId)! : null;
      return {
        menuItemId: item.menuItemId,
        // Prix faisant foi depuis la base quand l'article vient de la carte ;
        // le prix saisi n'est accepté que pour un article libre (sans
        // menuItemId), dans le flux caisse interne.
        price: db ? Number(db.price) : item.price,
        name: db ? db.name : item.name,
        quantity: item.quantity,
        image: db ? db.image : item.image,
      };
    });

    const itemsTotal = sanitizedItems.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0,
    );
    const total = itemsTotal + (data.deliveryFee ?? 0);

    const { order, lowStockWarnings } = await this.prisma.$transaction(
      async (tx) => {
        if (orderData.tableId) {
          const table = await tx.table.findFirst({
            where: { id: orderData.tableId, deletedAt: null },
            select: { id: true },
          });
          if (!table) {
            throw new BadRequestException('Table introuvable');
          }
        }

        const createdOrder = await tx.order.create({
          data: {
            ...orderData,
            userId,
            customerId: resolvedCustomerId ?? orderData.customerId,
            total,
            orderItems: {
              create: sanitizedItems.map((item) => ({
                menuItemId: item.menuItemId,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                image: item.image,
              })),
            },
          },
          include: { orderItems: true, table: true },
        });

        // Décrémente le stock des ingrédients (via les recettes définies) —
        // rejette toute la commande si le stock est insuffisant.
        const warnings = await this.inventoryService.decrementStockForOrder(
          tx,
          createdOrder.id,
          sanitizedItems.map((i) => ({
            menuItemId: i.menuItemId,
            quantity: i.quantity,
          })),
        );

        return { order: createdOrder, lowStockWarnings: warnings };
      },
    );

    this.eventsService.emitToStaff('new-order', order);
    for (const warning of lowStockWarnings) {
      this.eventsService.emitToStaff('low-stock-alert', warning);
    }

    return order;
  }

  findKitchenOrders() {
    return this.prisma.order.findMany({
      where: {
        status: { in: ['pending', 'preparing'] },
        deletedAt: null,
      },
      include: {
        orderItems: true,
        table: true,
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    // Valider la transition d'état avant mise à jour
    const current = await this.prisma.order.findFirst({
      where: { id, deletedAt: null },
      select: { status: true },
    });

    if (!current) throw new NotFoundException('Commande introuvable');

    const allowed = VALID_ORDER_TRANSITIONS[current.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Transition invalide : ${current.status} → ${dto.status}. Transitions autorisées : ${allowed.join(', ') || 'aucune'}.`,
      );
    }

    const order = await this.prisma.order.update({
      where: { id },
      data: { status: dto.status },
    });

    this.eventsService.emitToStaff('order-status-updated', {
      id,
      status: dto.status,
    });
    this.eventsService.emitToOrderTracking(id, 'status-update', {
      status: dto.status,
    });

    return order;
  }

  remove(id: string) {
    // Soft-delete : préserve l'historique comptable et les relations
    // (paiement, mouvements de stock).
    return this.prisma.order.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getTracking(id: string) {
    // findFirst (pas findUnique) : deletedAt n'est pas une clé unique, mais
    // une commande soft-deleted ne doit plus être suivie publiquement.
    const order = await this.prisma.order.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        status: true,
        type: true,
        total: true,
        createdAt: true,
        updatedAt: true,
        specialNotes: true,
        deliveryFee: true,
        deliveryAddress: true,
        table: { select: { number: true } },
        deliveryZone: { select: { name: true, deliveryTime: true } },
        orderItems: {
          select: {
            id: true,
            name: true,
            quantity: true,
            price: true,
            image: true,
            options: true,
          },
        },
      },
    });

    if (!order) return null;

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: RESTAURANT_ID },
      select: { name: true, logo: true, primaryColor: true, currency: true },
    });

    return { ...order, restaurant };
  }
}
