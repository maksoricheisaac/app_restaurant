import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../gateway/events.service';
import { PlanLimitService } from '../plans/plans.service';
import { CustomersService } from '../customers/customers.service';
import { InventoryService } from '../inventory/inventory.service';
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
    private planLimitService: PlanLimitService,
    private customersService: CustomersService,
    private inventoryService: InventoryService,
  ) {}

  async findAll(tenantId: string | undefined, filters: OrderFiltersDto) {
    if (!tenantId) throw new ForbiddenException('Tenant context required');
    const { status, type, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * Math.min(limit, 100);
    const take = Math.min(limit, 100);

    const where = {
      tenantId,
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

  async findOne(tenantId: string | undefined, id: string) {
    if (!tenantId) throw new ForbiddenException('Tenant context required');
    return this.prisma.order.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        orderItems: true,
        table: true,
        payment: true,
        user: { select: { name: true, email: true } },
      },
    });
  }

  async create(tenantId: string, data: CreateOrderDto, userId?: string) {
    // Enforce monthly order quota before accepting the order.
    await this.planLimitService.assertMonthlyOrderLimit(tenantId);

    const { items, customerName, customerEmail, customerPhone, ...orderData } =
      data;

    // Auto-upsert customer from order interaction (name/email/phone)
    let resolvedCustomerId = data.customerId ?? null;
    if (
      !resolvedCustomerId &&
      (customerName || customerEmail || customerPhone)
    ) {
      resolvedCustomerId = await this.customersService.upsertFromInteraction({
        tenantId,
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
      });
    }

    // Re-fetch prices from DB for any item with a menuItemId — never trust client prices.
    const menuItemIds = items
      .filter((i) => i.menuItemId)
      .map((i) => i.menuItemId!);
    const dbMenuItems =
      menuItemIds.length > 0
        ? await this.prisma.menuItem.findMany({
            where: { id: { in: menuItemIds }, tenantId, deletedAt: null },
            select: { id: true, name: true, price: true, image: true },
          })
        : [];

    const priceMap = new Map(dbMenuItems.map((m) => [m.id, m]));

    // All referenced menuItems must belong to this tenant and be non-deleted.
    for (const item of items) {
      if (item.menuItemId && !priceMap.has(item.menuItemId)) {
        throw new BadRequestException(
          `Article inconnu ou indisponible: ${item.menuItemId}`,
        );
      }
    }

    const sanitizedItems = items.map((item) => {
      const db = item.menuItemId ? priceMap.get(item.menuItemId)! : null;
      return {
        menuItemId: item.menuItemId,
        // Authoritative price from DB when menuItemId is known; staff-supplied price only for
        // manual/custom items (no menuItemId) in the internal POS flow.
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
        // Un tableId doit appartenir au tenant résolu — sans ce contrôle, un
        // UUID de table d'un autre restaurant pouvait être attaché à la
        // commande sans aucune vérification serveur.
        if (orderData.tableId) {
          const table = await tx.table.findFirst({
            where: { id: orderData.tableId, tenantId, deletedAt: null },
            select: { id: true },
          });
          if (!table) {
            throw new BadRequestException(
              'Table introuvable pour ce restaurant',
            );
          }
        }

        const createdOrder = await tx.order.create({
          data: {
            ...orderData,
            tenantId,
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
          tenantId,
          createdOrder.id,
          sanitizedItems.map((i) => ({
            menuItemId: i.menuItemId,
            quantity: i.quantity,
          })),
        );

        return { order: createdOrder, lowStockWarnings: warnings };
      },
    );

    this.eventsService.emitToTenant(tenantId, 'new-order', order);
    for (const warning of lowStockWarnings) {
      this.eventsService.emitToTenant(tenantId, 'low-stock-alert', warning);
    }

    return order;
  }

  async findKitchenOrders(tenantId: string) {
    return this.prisma.order.findMany({
      where: {
        tenantId,
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

  async updateStatus(
    tenantId: string | undefined,
    id: string,
    dto: UpdateOrderStatusDto,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required');

    // Valider la transition d'état avant mise à jour
    const current = await this.prisma.order.findFirst({
      where: { id, tenantId, deletedAt: null },
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
      where: { id, tenantId },
      data: { status: dto.status },
    });

    this.eventsService.emitToTenant(tenantId, 'order-status-updated', {
      id,
      status: dto.status,
    });
    this.eventsService.emitToRoom(`order-tracking-${id}`, 'status-update', {
      status: dto.status,
    });

    return order;
  }

  async remove(tenantId: string | undefined, id: string) {
    if (!tenantId) throw new ForbiddenException('Tenant context required');
    // Soft-delete : préserve l'historique comptable et les relations (payment, stockMovements)
    return this.prisma.order.update({
      where: { id, tenantId },
      data: { deletedAt: new Date() },
    });
  }

  async getTracking(id: string) {
    // findFirst (pas findUnique) : deletedAt n'est pas une clé unique, mais
    // une commande soft-deleted ne doit plus être trackable publiquement.
    return this.prisma.order.findFirst({
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
        tenant: {
          select: {
            name: true,
            logo: true,
            primaryColor: true,
            currency: true,
            slug: true,
          },
        },
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
  }
}
