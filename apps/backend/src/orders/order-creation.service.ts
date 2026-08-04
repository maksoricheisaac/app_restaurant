import { Injectable, BadRequestException } from '@nestjs/common';
import { OrderLineStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../gateway/events.service';
import { CustomersService } from '../customers/customers.service';
import { InventoryService } from '../inventory/inventory.service';
import { stripHtml } from '../common/utils/sanitize';
import { OrderNumberingService } from './order-numbering.service';
import {
  OrderLinePricingService,
  CHANNEL_POLICIES,
  type ChannelPolicy,
  type OrderChannel,
  type OrderLineInput,
} from './order-line-pricing.service';
import { deriveOrderStatus } from './order-lifecycle';

export type {
  OrderChannel,
  OrderLineInput,
} from './order-line-pricing.service';

export type OrderServiceType = 'dine_in' | 'takeaway' | 'delivery';

export interface CreateOrderInput {
  /** Origine de la commande — détermine les règles appliquées. */
  channel: OrderChannel;
  type: OrderServiceType;
  items: OrderLineInput[];
  tableId?: string | null;
  deliveryZoneId?: string | null;
  deliveryAddress?: string | null;
  /** Frais imposés à la main — canal `pos` et seulement sans zone. */
  deliveryFee?: number | null;
  specialNotes?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  /** Employé à l'origine de la saisie. Absent pour une commande client. */
  userId?: string | null;
  /**
   * Envoyer immédiatement les lignes en cuisine.
   *
   * `true` par défaut : c'est le comportement d'un comptoir et le seul
   * possible pour une commande client. Un service à table passe `false` pour
   * ouvrir un ticket que le serveur complétera avant de l'envoyer.
   */
  sendImmediately?: boolean;
}

/**
 * Ouverture d'un ticket.
 *
 * Chemin unique : le comptoir et le parcours client public entrent tous les
 * deux ici via un adaptateur qui traduit leur DTO et passe leur `channel`.
 * La suite de la vie du ticket — ajout d'une tournée, annulation d'une ligne,
 * envoi en cuisine — appartient à `OrderTicketService`.
 */
@Injectable()
export class OrderCreationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
    private readonly customersService: CustomersService,
    private readonly inventoryService: InventoryService,
    private readonly pricing: OrderLinePricingService,
    private readonly numbering: OrderNumberingService,
  ) {}

  async create(input: CreateOrderInput) {
    const policy = CHANNEL_POLICIES[input.channel];

    // Une commande client part toujours directement en cuisine : personne
    // n'est là pour décider de l'envoi.
    const requestedSend =
      input.channel === 'public' ? true : (input.sendImmediately ?? true);

    // Un ticket peut s'ouvrir vide : en salle, il naît quand le client
    // s'installe, avant que quoi que ce soit soit commandé. Un client en
    // ligne, lui, commande forcément quelque chose.
    const hasItems = input.items && input.items.length > 0;
    if (!hasItems && input.channel === 'public') {
      throw new BadRequestException(
        'La commande doit contenir au moins un article',
      );
    }

    const lines = hasItems
      ? await this.pricing.priceLines(input.items, input.channel)
      : [];

    const sendImmediately = requestedSend && lines.length > 0;

    const itemsSubtotal = lines.reduce(
      (sum, line) => sum + line.price * line.quantity,
      0,
    );

    const delivery = await this.resolveDelivery(input, policy, itemsSubtotal);
    const total = itemsSubtotal + delivery.fee;

    // Nettoyage des champs libres : empêche un XSS stocké côté administration.
    const specialNotes = stripHtml(input.specialNotes ?? undefined) ?? null;
    const customerName = stripHtml(input.customerName ?? undefined);
    const customerPhone = stripHtml(input.customerPhone ?? undefined);
    const customerEmail = stripHtml(input.customerEmail ?? undefined);

    // Rapproche ou crée la fiche client. Hors transaction, pour ne pas
    // allonger la transaction principale.
    let customerId = input.customerId ?? null;
    if (!customerId && (customerName || customerEmail || customerPhone)) {
      customerId = await this.customersService.upsertFromInteraction({
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
      });
    }

    const serviceDate = await this.numbering.serviceDateFor();
    const isDineIn = input.type === 'dine_in';
    const lineStatus = sendImmediately
      ? OrderLineStatus.sent
      : OrderLineStatus.draft;
    const sentAt = sendImmediately ? new Date() : null;

    const { order, lowStockWarnings } = await this.prisma.$transaction(
      async (tx) => {
        // Le tableId vient d'un QR code ou d'un choix à l'écran : il doit
        // désigner une table existante et non supprimée.
        if (isDineIn && input.tableId) {
          const table = await tx.table.findFirst({
            where: { id: input.tableId, deletedAt: null },
            select: { id: true },
          });
          if (!table) {
            throw new BadRequestException('Table introuvable');
          }
        }

        const number = await this.numbering.allocate(tx, serviceDate);

        const createdOrder = await tx.order.create({
          data: {
            number,
            serviceDate,
            type: input.type,
            status: deriveOrderStatus(
              lines.map(() => ({ status: lineStatus })),
            ),
            userId: input.userId ?? undefined,
            customerId,
            tableId: isDineIn ? (input.tableId ?? null) : null,
            deliveryZoneId: delivery.zoneId,
            deliveryAddress: delivery.address,
            deliveryFee: input.type === 'delivery' ? delivery.fee : null,
            total,
            specialNotes,
            orderItems: {
              create: lines.map((line) => ({
                menuItemId: line.menuItemId,
                name: line.name,
                quantity: line.quantity,
                price: line.price,
                image: line.image,
                options: line.options,
                status: lineStatus,
                sentAt,
              })),
            },
          },
          include: { orderItems: true, table: true },
        });

        // Le stock ne se décrémente qu'à l'envoi en cuisine : un ticket
        // ouvert dont les lignes restent en brouillon ne consomme rien.
        const warnings = sendImmediately
          ? await this.inventoryService.decrementStockForOrder(
              tx,
              createdOrder.id,
              lines.map((line) => ({
                menuItemId: line.menuItemId,
                quantity: line.quantity,
              })),
            )
          : [];

        return { order: createdOrder, lowStockWarnings: warnings };
      },
    );

    if (sendImmediately) {
      this.eventsService.emitToStaff('new-order', order);
      for (const warning of lowStockWarnings) {
        this.eventsService.emitToStaff('low-stock-alert', warning);
      }
    } else {
      // Rien n'est encore parti en cuisine : on prévient la salle, pas le
      // poste de préparation.
      this.eventsService.emitToStaff('ticket-opened', order);
    }

    return order;
  }

  // ─── Livraison ─────────────────────────────────────────────────────────────

  /**
   * Détermine les frais de livraison. Dès qu'une zone est désignée, son
   * tarif fait foi — y compris au comptoir, où le montant était auparavant
   * accepté tel quel sans vérification.
   */
  private async resolveDelivery(
    input: CreateOrderInput,
    policy: ChannelPolicy,
    itemsSubtotal: number,
  ): Promise<{ fee: number; zoneId: string | null; address: string | null }> {
    if (input.type !== 'delivery') {
      return { fee: 0, zoneId: null, address: null };
    }

    const address = stripHtml(input.deliveryAddress ?? undefined) ?? null;

    if (!input.deliveryZoneId) {
      if (policy.requireDeliveryZone) {
        throw new BadRequestException('Veuillez choisir une zone de livraison');
      }
      // Livraison ponctuelle saisie au comptoir, hors zone publiée.
      const manualFee = input.deliveryFee ?? 0;
      if (manualFee < 0) {
        throw new BadRequestException(
          'Les frais de livraison ne peuvent pas être négatifs',
        );
      }
      return { fee: manualFee, zoneId: null, address };
    }

    const zone = await this.prisma.deliveryZone.findFirst({
      where: { id: input.deliveryZoneId, isActive: true, deletedAt: null },
      select: { id: true, price: true, minOrder: true },
    });
    if (!zone) {
      throw new BadRequestException('Zone de livraison introuvable');
    }
    if (
      policy.enforceDeliveryMinimum &&
      zone.minOrder != null &&
      itemsSubtotal < Number(zone.minOrder)
    ) {
      throw new BadRequestException(
        `Le minimum de commande pour cette zone est de ${Number(zone.minOrder)}`,
      );
    }

    return { fee: Number(zone.price), zoneId: zone.id, address };
  }
}
