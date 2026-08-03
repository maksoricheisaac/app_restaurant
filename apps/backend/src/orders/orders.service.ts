import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../gateway/events.service';
import { AuditService } from '../common/audit/audit.service';
import { OrderCreationService } from './order-creation.service';
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
    private orderCreation: OrderCreationService,
    private audit: AuditService,
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

  /**
   * Prise de commande au comptoir. Adaptateur : traduit le DTO du POS en
   * entrée canonique et délègue au chemin unique de création, partagé avec
   * le parcours client public — options et suppléments compris.
   */
  create(data: CreateOrderDto, userId?: string) {
    return this.orderCreation.create({
      channel: 'pos',
      type: data.type,
      items: data.items.map((item) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        selectedOptionIds: item.selectedOptionIds,
        name: item.name,
        price: item.price,
        image: item.image,
      })),
      tableId: data.tableId,
      deliveryZoneId: data.deliveryZoneId,
      deliveryAddress: data.deliveryAddress,
      deliveryFee: data.deliveryFee,
      specialNotes: data.specialNotes,
      customerId: data.customerId,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      userId,
    });
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

  async updateStatus(
    id: string,
    dto: UpdateOrderStatusDto,
    actor?: { id: string; email?: string; role?: string },
  ) {
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

    // Entrée d'audit métier : contrairement au middleware, ce service connaît
    // l'état antérieur — c'est le seul endroit où `before` peut être exact.
    this.audit.recordDetached({
      action: 'order.status_changed',
      entity: 'order',
      entityId: id,
      userId: actor?.id ?? null,
      userEmail: actor?.email ?? null,
      userRole: actor?.role ?? null,
      before: { status: current.status },
      after: { status: dto.status },
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
