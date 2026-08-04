import { Injectable } from '@nestjs/common';
import { OrderLineStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OrderCreationService } from './order-creation.service';
import { buildTaxBuckets } from './order-tax';
import { isLineActive } from './order-lifecycle';
import { OrderTicketService, type Actor } from './order-ticket.service';
import { RESTAURANT_ID } from '../restaurant/restaurant.constants';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderFiltersDto } from './dto/order-filters.dto';
import {
  UpdateOrderStatusDto,
  OrderStatusTarget,
} from './dto/update-order-status.dto';

/** Lignes visibles par la cuisine : parties, en cours, ou prêtes à servir. */
const KITCHEN_LINE_STATUSES = [
  OrderLineStatus.sent,
  OrderLineStatus.preparing,
  OrderLineStatus.ready,
];

/**
 * Un avancement demandé sur le ticket se traduit par un avancement de ses
 * lignes : c'est là que vit désormais le cycle de vie.
 */
const LINE_TARGET_FOR_ORDER_STATUS: Record<
  Exclude<OrderStatusTarget, OrderStatusTarget.CANCELLED>,
  OrderLineStatus
> = {
  [OrderStatusTarget.PREPARING]: OrderLineStatus.preparing,
  [OrderStatusTarget.READY]: OrderLineStatus.ready,
  [OrderStatusTarget.SERVED]: OrderLineStatus.served,
};

/**
 * Ventilation par taux à imprimer en pied de ticket.
 *
 * Les lignes annulées en sont exclues : elles restent visibles sur le ticket
 * mais ne sont pas facturées, elles n'ont donc rien à peser dans la base
 * taxable.
 */
function activeTaxBuckets(
  lines: {
    status: OrderLineStatus;
    taxRate: unknown;
    lineExclTax: unknown;
    lineTax: unknown;
    lineInclTax: unknown;
  }[],
) {
  return buildTaxBuckets(lines.filter((l) => isLineActive(l.status)));
}

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private orderCreation: OrderCreationService,
    private ticket: OrderTicketService,
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
          orderItems: { orderBy: { createdAt: 'asc' } },
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

  async findOne(id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, deletedAt: null },
      include: {
        orderItems: { orderBy: { createdAt: 'asc' } },
        table: true,
        payment: true,
        user: { select: { name: true, email: true } },
      },
    });

    if (!order) return null;

    return { ...order, taxBuckets: activeTaxBuckets(order.orderItems) };
  }

  /**
   * Ouverture d'un ticket au comptoir. Adaptateur : traduit le DTO du POS en
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
      sendImmediately: data.sendImmediately,
      userId,
    });
  }

  /**
   * Écran cuisine.
   *
   * Le filtre porte sur les LIGNES, pas sur le ticket : un ticket dont la
   * première tournée est prête et la seconde encore en brouillon doit
   * afficher exactement ce qui est parti, ni plus ni moins. Filtrer sur le
   * statut du ticket aurait fait disparaître de l'écran une tournée en cours
   * dès qu'une nouvelle ligne était saisie en salle.
   */
  findKitchenOrders() {
    return this.prisma.order.findMany({
      where: {
        deletedAt: null,
        closedAt: null,
        orderItems: { some: { status: { in: KITCHEN_LINE_STATUSES } } },
      },
      include: {
        orderItems: {
          where: { status: { in: KITCHEN_LINE_STATUSES } },
          orderBy: [{ sentAt: 'asc' }, { createdAt: 'asc' }],
        },
        table: true,
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
  }

  /**
   * Avancement demandé au niveau du ticket.
   *
   * Le statut du ticket est désormais dérivé de ses lignes : le poser
   * directement serait aussitôt écrasé au recalcul suivant. Cette route
   * applique donc l'avancement à toutes les lignes éligibles — ce qui est
   * exactement ce que veut dire « marquer la commande prête » sur l'écran
   * cuisine.
   */
  updateStatus(id: string, dto: UpdateOrderStatusDto, actor?: Actor) {
    if (dto.status === OrderStatusTarget.CANCELLED) {
      return this.ticket.cancelOrder(id, dto.reason ?? '', actor ?? { id: '' });
    }

    return this.ticket.advanceAllLines(
      id,
      LINE_TARGET_FOR_ORDER_STATUS[dto.status],
      actor,
    );
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
        number: true,
        status: true,
        type: true,
        total: true,
        subtotalExclTax: true,
        taxTotal: true,
        taxIncluded: true,
        createdAt: true,
        updatedAt: true,
        specialNotes: true,
        deliveryFee: true,
        deliveryAddress: true,
        table: { select: { number: true } },
        deliveryZone: { select: { name: true, deliveryTime: true } },
        orderItems: {
          // Le client n'a pas à voir une ligne annulée en cuisine ni un
          // brouillon que le serveur n'a pas encore envoyé.
          where: { status: { not: OrderLineStatus.cancelled } },
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            name: true,
            quantity: true,
            price: true,
            image: true,
            options: true,
            status: true,
            taxRate: true,
            lineExclTax: true,
            lineTax: true,
            lineInclTax: true,
          },
        },
      },
    });

    if (!order) return null;

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: RESTAURANT_ID },
      select: { name: true, logo: true, primaryColor: true, currency: true },
    });

    return {
      ...order,
      restaurant,
      taxBuckets: activeTaxBuckets(order.orderItems),
    };
  }
}
