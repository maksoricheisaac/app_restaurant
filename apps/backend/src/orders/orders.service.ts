import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../gateway/events.service';
import { PlanLimitService } from '../plans/plans.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderFiltersDto } from './dto/order-filters.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private eventsService: EventsService,
    private planLimitService: PlanLimitService,
  ) {}

  async findAll(tenantId: string | undefined, filters: OrderFiltersDto) {
    if (!tenantId) throw new ForbiddenException('Tenant context required');
    const { status, type, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * Math.min(limit, 100);
    const take = Math.min(limit, 100);

    const where = {
      tenantId,
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
      where: { id, tenantId },
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

    const { items, ...orderData } = data;

    // Re-fetch prices from DB for any item with a menuItemId — never trust client prices.
    const menuItemIds = items.filter((i) => i.menuItemId).map((i) => i.menuItemId!);
    const dbMenuItems = menuItemIds.length > 0
      ? await this.prisma.menuItem.findMany({
          where: { id: { in: menuItemIds }, tenantId, deletedAt: null },
          select: { id: true, name: true, price: true, image: true },
        })
      : [];

    const priceMap = new Map(dbMenuItems.map((m) => [m.id, m]));

    // All referenced menuItems must belong to this tenant and be non-deleted.
    for (const item of items) {
      if (item.menuItemId && !priceMap.has(item.menuItemId)) {
        throw new BadRequestException(`Article inconnu ou indisponible: ${item.menuItemId}`);
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

    const itemsTotal = sanitizedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const total = itemsTotal + (data.deliveryFee ?? 0);

    const order = await this.prisma.order.create({
      data: {
        ...orderData,
        tenantId,
        userId,
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

    this.eventsService.emitToTenant(tenantId, 'new-order', order);

    return order;
  }

  async updateStatus(tenantId: string | undefined, id: string, dto: UpdateOrderStatusDto) {
    if (!tenantId) throw new ForbiddenException('Tenant context required');
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
    return this.prisma.order.delete({
      where: { id, tenantId },
    });
  }

  async getTracking(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
