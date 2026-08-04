import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { OrderLineStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../gateway/events.service';
import { InventoryService } from '../inventory/inventory.service';
import { AuditService } from '../common/audit/audit.service';
import {
  OrderLinePricingService,
  type OrderLineInput,
} from './order-line-pricing.service';
import {
  canTransitionLine,
  computeOrderTotal,
  deriveOrderStatus,
  isLineSent,
  isOrderLocked,
} from './order-lifecycle';

/** Employé à l'origine de l'opération, pour la piste d'audit. */
export interface Actor {
  id: string;
  email?: string;
  role?: string;
}

const ORDER_WITH_LINES = {
  orderItems: { orderBy: { createdAt: 'asc' } },
  table: true,
} as const;

/**
 * Vie d'un ticket ouvert : ajouter une tournée, corriger une saisie, annuler
 * un plat, envoyer en cuisine, faire avancer la préparation.
 *
 * Sans ce service, une commande était figée à sa création — le service à
 * table était impossible. Trois invariants tiennent l'ensemble :
 *
 *  1. `Order.status` et `Order.total` sont TOUJOURS recalculés depuis les
 *     lignes, jamais posés à la main.
 *  2. Le stock suit l'envoi en cuisine, pas la saisie : un brouillon ne
 *     consomme rien, une annulation après envoi restitue.
 *  3. Un ticket encaissé est verrouillé : plus aucune ligne ne bouge.
 */
@Injectable()
export class OrderTicketService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
    private readonly inventoryService: InventoryService,
    private readonly pricing: OrderLinePricingService,
    private readonly audit: AuditService,
  ) {}

  // ─── Lecture ───────────────────────────────────────────────────────────────

  /** Tickets encore ouverts — reprise du service, plan de salle. */
  findOpen() {
    return this.prisma.order.findMany({
      where: {
        deletedAt: null,
        closedAt: null,
        status: { notIn: ['paid', 'cancelled'] },
      },
      include: ORDER_WITH_LINES,
      orderBy: { createdAt: 'asc' },
    });
  }

  // ─── Ajout d'une tournée ───────────────────────────────────────────────────

  /**
   * Ajoute des lignes à un ticket ouvert.
   *
   * Les lignes entrent en brouillon : le serveur compose la tournée puis
   * l'envoie d'un geste. `sendImmediately` court-circuite pour un ajout de
   * dernière minute au comptoir.
   */
  async addLines(
    orderId: string,
    items: OrderLineInput[],
    options: { sendImmediately?: boolean } = {},
    actor?: Actor,
  ) {
    const order = await this.loadOpenOrder(orderId);
    // Toujours le canal comptoir : seul un employé ajoute à un ticket ouvert,
    // le parcours client n'expose aucune route de ce genre.
    const lines = await this.pricing.priceLines(items, 'pos');

    const sendImmediately = options.sendImmediately ?? false;
    const status = sendImmediately
      ? OrderLineStatus.sent
      : OrderLineStatus.draft;
    const sentAt = sendImmediately ? new Date() : null;

    const { updated, warnings } = await this.prisma.$transaction(async (tx) => {
      await Promise.all(
        lines.map((line) =>
          tx.orderLine.create({
            data: {
              orderId,
              menuItemId: line.menuItemId,
              name: line.name,
              quantity: line.quantity,
              price: line.price,
              image: line.image,
              options: line.options,
              status,
              sentAt,
            },
          }),
        ),
      );

      const stockWarnings = sendImmediately
        ? await this.inventoryService.decrementStockForOrder(
            tx,
            orderId,
            lines.map((l) => ({
              menuItemId: l.menuItemId,
              quantity: l.quantity,
            })),
          )
        : [];

      return {
        updated: await this.recalculate(tx, orderId),
        warnings: stockWarnings,
      };
    });

    this.audit.recordDetached({
      action: 'order.lines_added',
      entity: 'order',
      entityId: orderId,
      userId: actor?.id ?? null,
      userEmail: actor?.email ?? null,
      userRole: actor?.role ?? null,
      before: { status: order.status, total: Number(order.total ?? 0) },
      after: {
        status: updated.status,
        total: Number(updated.total ?? 0),
        addedLines: lines.map((l) => ({
          name: l.name,
          quantity: l.quantity,
          price: l.price,
        })),
        sentToKitchen: sendImmediately,
      },
    });

    this.notify(updated, sendImmediately, warnings);
    return updated;
  }

  // ─── Correction d'un brouillon ─────────────────────────────────────────────

  /**
   * Change la quantité d'une ligne encore en brouillon. Une ligne partie en
   * cuisine ne se modifie plus : on l'annule et on en saisit une autre, pour
   * que la trace de ce qui a été préparé reste exacte.
   */
  async updateDraftLineQuantity(
    orderId: string,
    lineId: string,
    quantity: number,
    actor?: Actor,
  ) {
    if (quantity < 1) {
      throw new BadRequestException('La quantité doit être au moins de 1');
    }

    await this.loadOpenOrder(orderId);
    const line = await this.loadLine(orderId, lineId);

    if (line.status !== OrderLineStatus.draft) {
      throw new ConflictException(
        'Cette ligne est déjà partie en cuisine : annulez-la plutôt que de la modifier.',
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.orderLine.update({ where: { id: lineId }, data: { quantity } });
      return this.recalculate(tx, orderId);
    });

    this.audit.recordDetached({
      action: 'order.line_updated',
      entity: 'order',
      entityId: orderId,
      userId: actor?.id ?? null,
      userEmail: actor?.email ?? null,
      userRole: actor?.role ?? null,
      before: { lineId, quantity: line.quantity },
      after: { lineId, quantity },
    });

    this.eventsService.emitToStaff('ticket-updated', updated);
    return updated;
  }

  /**
   * Retire une ligne encore en brouillon. Rien n'a été préparé, rien n'a été
   * consommé : la ligne disparaît sans laisser de trace sur le ticket.
   */
  async removeDraftLine(orderId: string, lineId: string, actor?: Actor) {
    await this.loadOpenOrder(orderId);
    const line = await this.loadLine(orderId, lineId);

    if (line.status !== OrderLineStatus.draft) {
      throw new ConflictException(
        'Cette ligne est déjà partie en cuisine : elle doit être annulée avec un motif.',
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.orderLine.delete({ where: { id: lineId } });
      return this.recalculate(tx, orderId);
    });

    this.audit.recordDetached({
      action: 'order.line_removed',
      entity: 'order',
      entityId: orderId,
      userId: actor?.id ?? null,
      userEmail: actor?.email ?? null,
      userRole: actor?.role ?? null,
      before: { lineId, name: line.name, quantity: line.quantity },
      after: null,
    });

    this.eventsService.emitToStaff('ticket-updated', updated);
    return updated;
  }

  // ─── Annulation d'une ligne partie ────────────────────────────────────────

  /**
   * Annule une ligne déjà envoyée en cuisine. Le motif est obligatoire : une
   * annulation après envoi est une perte — de marchandise, de travail, ou de
   * chiffre d'affaires — et doit pouvoir être expliquée a posteriori.
   *
   * La ligne reste sur le ticket, barrée, et son stock est restitué.
   */
  async voidLine(
    orderId: string,
    lineId: string,
    reason: string,
    actor: Actor,
  ) {
    const trimmedReason = reason?.trim();
    if (!trimmedReason) {
      throw new BadRequestException(
        'Un motif est obligatoire pour annuler une ligne déjà partie en cuisine.',
      );
    }

    await this.loadOpenOrder(orderId);
    const line = await this.loadLine(orderId, lineId);

    if (line.status === OrderLineStatus.cancelled) {
      throw new ConflictException('Cette ligne est déjà annulée.');
    }
    if (line.status === OrderLineStatus.draft) {
      throw new ConflictException(
        "Cette ligne n'est pas partie en cuisine : retirez-la simplement du ticket.",
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.orderLine.update({
        where: { id: lineId },
        data: {
          status: OrderLineStatus.cancelled,
          cancelledAt: new Date(),
          cancelReason: trimmedReason,
          cancelledBy: actor.id,
        },
      });

      // Restitution du stock consommé à l'envoi. Sans elle, chaque annulation
      // creuserait un écart d'inventaire invisible.
      await this.inventoryService.restoreStockForLine(tx, orderId, {
        menuItemId: line.menuItemId,
        quantity: line.quantity,
        reason: trimmedReason,
      });

      return this.recalculate(tx, orderId);
    });

    this.audit.recordDetached({
      action: 'order.line_voided',
      entity: 'order',
      entityId: orderId,
      userId: actor.id,
      userEmail: actor.email ?? null,
      userRole: actor.role ?? null,
      before: {
        lineId,
        name: line.name,
        quantity: line.quantity,
        price: Number(line.price),
        status: line.status,
      },
      after: { lineId, status: 'cancelled', reason: trimmedReason },
    });

    this.eventsService.emitToStaff('ticket-updated', updated);
    this.eventsService.emitToStaff('order-status-updated', {
      id: orderId,
      status: updated.status,
    });
    return updated;
  }

  // ─── Envoi en cuisine ─────────────────────────────────────────────────────

  /**
   * Envoie en cuisine toutes les lignes encore en brouillon.
   *
   * C'est ici que le stock est consommé. Les lignes parties ensemble
   * partagent le même `sentAt` : c'est ce qui identifie une tournée sur
   * l'écran de préparation.
   */
  async sendToKitchen(orderId: string, actor?: Actor) {
    const order = await this.loadOpenOrder(orderId);

    const drafts = order.orderItems.filter(
      (l) => l.status === OrderLineStatus.draft,
    );
    if (drafts.length === 0) {
      throw new ConflictException(
        'Aucune ligne en attente : tout est déjà parti en cuisine.',
      );
    }

    const sentAt = new Date();

    const { updated, warnings } = await this.prisma.$transaction(async (tx) => {
      await tx.orderLine.updateMany({
        where: { orderId, status: OrderLineStatus.draft },
        data: { status: OrderLineStatus.sent, sentAt },
      });

      const stockWarnings = await this.inventoryService.decrementStockForOrder(
        tx,
        orderId,
        drafts.map((l) => ({
          menuItemId: l.menuItemId,
          quantity: l.quantity,
        })),
      );

      return {
        updated: await this.recalculate(tx, orderId),
        warnings: stockWarnings,
      };
    });

    this.audit.recordDetached({
      action: 'order.sent_to_kitchen',
      entity: 'order',
      entityId: orderId,
      userId: actor?.id ?? null,
      userEmail: actor?.email ?? null,
      userRole: actor?.role ?? null,
      after: {
        sentAt,
        lines: drafts.map((l) => ({ name: l.name, quantity: l.quantity })),
      },
    });

    this.notify(updated, true, warnings);
    return updated;
  }

  // ─── Avancement en cuisine ────────────────────────────────────────────────

  /** Fait avancer une ligne : prise en charge, prête, servie. */
  async advanceLine(
    orderId: string,
    lineId: string,
    to: OrderLineStatus,
    actor?: Actor,
  ) {
    if (to === OrderLineStatus.cancelled) {
      throw new BadRequestException(
        'Une annulation passe par la route dédiée : elle exige un motif.',
      );
    }

    await this.loadOpenOrder(orderId);
    const line = await this.loadLine(orderId, lineId);

    if (!canTransitionLine(line.status, to)) {
      throw new BadRequestException(
        `Transition invalide : ${line.status} → ${to}.`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.orderLine.update({
        where: { id: lineId },
        data: { status: to },
      });
      return this.recalculate(tx, orderId);
    });

    this.eventsService.emitToStaff('ticket-updated', updated);
    this.eventsService.emitToStaff('order-status-updated', {
      id: orderId,
      status: updated.status,
    });
    this.eventsService.emitToOrderTracking(orderId, 'status-update', {
      status: updated.status,
    });

    this.audit.recordDetached({
      action: 'order.line_advanced',
      entity: 'order',
      entityId: orderId,
      userId: actor?.id ?? null,
      userEmail: actor?.email ?? null,
      userRole: actor?.role ?? null,
      before: { lineId, status: line.status },
      after: { lineId, status: to, orderStatus: updated.status },
    });

    return updated;
  }

  /**
   * Fait avancer d'un geste toutes les lignes éligibles du ticket.
   *
   * C'est l'action « marquer la commande prête » de l'écran cuisine : elle
   * porte sur le ticket, mais s'applique bien aux lignes — sans quoi le
   * statut recalculé écraserait aussitôt le statut posé sur la commande.
   */
  async advanceAllLines(orderId: string, to: OrderLineStatus, actor?: Actor) {
    const order = await this.loadOpenOrder(orderId);

    const eligible = order.orderItems.filter((l) =>
      canTransitionLine(l.status, to),
    );
    if (eligible.length === 0) {
      throw new BadRequestException(
        `Aucune ligne de ce ticket ne peut passer à « ${to} ».`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.orderLine.updateMany({
        where: { id: { in: eligible.map((l) => l.id) } },
        data: { status: to },
      });
      return this.recalculate(tx, orderId);
    });

    this.eventsService.emitToStaff('order-status-updated', {
      id: orderId,
      status: updated.status,
    });
    this.eventsService.emitToOrderTracking(orderId, 'status-update', {
      status: updated.status,
    });

    this.audit.recordDetached({
      action: 'order.advanced',
      entity: 'order',
      entityId: orderId,
      userId: actor?.id ?? null,
      userEmail: actor?.email ?? null,
      userRole: actor?.role ?? null,
      before: { status: order.status },
      after: { status: updated.status, lineTarget: to, lines: eligible.length },
    });

    return updated;
  }

  // ─── Annulation du ticket entier ──────────────────────────────────────────

  async cancelOrder(orderId: string, reason: string, actor: Actor) {
    const trimmedReason = reason?.trim();
    if (!trimmedReason) {
      throw new BadRequestException(
        'Un motif est obligatoire pour annuler un ticket.',
      );
    }

    const order = await this.loadOpenOrder(orderId);
    const toRestore = order.orderItems.filter((l) => isLineSent(l.status));

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.orderLine.updateMany({
        where: { orderId, status: { not: OrderLineStatus.cancelled } },
        data: {
          status: OrderLineStatus.cancelled,
          cancelledAt: new Date(),
          cancelReason: trimmedReason,
          cancelledBy: actor.id,
        },
      });

      for (const line of toRestore) {
        await this.inventoryService.restoreStockForLine(tx, orderId, {
          menuItemId: line.menuItemId,
          quantity: line.quantity,
          reason: trimmedReason,
        });
      }

      return this.recalculate(tx, orderId);
    });

    this.audit.recordDetached({
      action: 'order.cancelled',
      entity: 'order',
      entityId: orderId,
      userId: actor.id,
      userEmail: actor.email ?? null,
      userRole: actor.role ?? null,
      before: { status: order.status, total: Number(order.total ?? 0) },
      after: { status: updated.status, reason: trimmedReason },
    });

    this.eventsService.emitToStaff('order-status-updated', {
      id: orderId,
      status: updated.status,
    });
    this.eventsService.emitToOrderTracking(orderId, 'status-update', {
      status: updated.status,
    });

    return updated;
  }

  // ─── Invariants ───────────────────────────────────────────────────────────

  /**
   * Recalcule total et statut depuis les lignes, et renvoie le ticket à jour.
   *
   * Appelé après CHAQUE opération. C'est ce qui rend impossible qu'un ticket
   * affiche un total ou un avancement en désaccord avec son contenu.
   */
  private async recalculate(tx: Prisma.TransactionClient, orderId: string) {
    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { orderItems: true },
    });

    return tx.order.update({
      where: { id: orderId },
      data: {
        total: computeOrderTotal(order.orderItems, order.deliveryFee),
        status: deriveOrderStatus(order.orderItems, order.closedAt),
      },
      include: ORDER_WITH_LINES,
    });
  }

  /** Charge un ticket et refuse toute opération s'il est encaissé. */
  private async loadOpenOrder(orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, deletedAt: null },
      include: ORDER_WITH_LINES,
    });

    if (!order) throw new NotFoundException('Ticket introuvable');

    if (isOrderLocked(order)) {
      throw new ConflictException(
        'Ce ticket est encaissé : son contenu ne peut plus être modifié.',
      );
    }

    return order;
  }

  private async loadLine(orderId: string, lineId: string) {
    const line = await this.prisma.orderLine.findFirst({
      where: { id: lineId, orderId },
    });
    if (!line) throw new NotFoundException('Ligne introuvable sur ce ticket');
    return line;
  }

  private notify(
    order: { id: string; status: string },
    wentToKitchen: boolean,
    warnings: unknown[],
  ) {
    this.eventsService.emitToStaff('ticket-updated', order);
    if (wentToKitchen) {
      this.eventsService.emitToStaff('new-order', order);
      for (const warning of warnings) {
        this.eventsService.emitToStaff('low-stock-alert', warning);
      }
    }
  }
}
