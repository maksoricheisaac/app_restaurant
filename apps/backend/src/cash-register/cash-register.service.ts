import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { TransactionFiltersDto } from './dto/transaction-filters.dto';
import { OpenSessionDto, CloseSessionDto } from './dto/cash-session.dto';
import { getSkipTake, toPaginated } from '../common/pagination/paginate';

@Injectable()
export class CashRegisterService {
  constructor(private prisma: PrismaService) {}

  async processPayment(
    tenantId: string,
    data: ProcessPaymentDto & { cashierId: string },
  ) {
    const { orderId, amount, method, cashierId } = data;

    // Verify order exists and belongs to this tenant
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId, deletedAt: null },
      select: { id: true, total: true, status: true },
    });
    if (!order) throw new NotFoundException('Commande introuvable');

    return this.prisma.$transaction(async (tx) => {
      // Rattache le paiement à la session de caisse ouverte, si une l'est —
      // sert au calcul du montant attendu à la clôture. Un paiement reste
      // valide même sans session ouverte (carte/en ligne notamment).
      const openSession = await tx.cashRegisterSession.findFirst({
        where: { tenantId, status: 'open' },
        select: { id: true },
      });

      // 1. Create payment
      const payment = await tx.payment.create({
        data: {
          tenantId,
          orderId,
          amount,
          method,
          cashierId,
          cashSessionId: openSession?.id ?? null,
        },
        include: {
          order: {
            include: {
              orderItems: true,
              table: { select: { number: true } },
            },
          },
          cashier: { select: { name: true } },
        },
      });

      // 2. Record sale transaction
      await tx.transaction.create({
        data: {
          tenantId,
          type: 'sale',
          amount,
          method,
          cashierId,
          orderId,
          description: `Paiement commande #${orderId.slice(-6).toUpperCase()}`,
        },
      });

      // 3. Mark order as served (terminal paid state)
      await tx.order.update({
        where: { id: orderId, tenantId },
        data: { status: 'served' },
      });

      return payment;
    });
  }

  async getTransactions(tenantId: string, filters: TransactionFiltersDto) {
    const { dateFrom, dateTo, type, cashierId } = filters;
    const where = {
      tenantId,
      ...(type ? { type } : {}),
      ...(cashierId ? { cashierId } : {}),
      createdAt: {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      },
    };
    const { skip, take, page, limit } = getSkipTake(
      filters.page,
      filters.limit,
    );

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: {
          cashier: { select: { name: true } },
          order: { select: { total: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return toPaginated(data, total, page, limit);
  }

  async getBilan(tenantId: string, date: string) {
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(`${date}T23:59:59.999`);

    // All payments processed today for this tenant.
    //
    // Décision explicite : ce total inclut les paiements dont la commande
    // liée a ensuite été soft-deleted (correction de saisie a posteriori).
    // Un Payment est un enregistrement financier immuable — une fois
    // l'argent encaissé, il doit rester dans le bilan de la journée même
    // si la commande associée est archivée ensuite ; c'est cohérent avec
    // le commentaire "protège l'historique comptable" sur Order.deletedAt.
    const payments = await this.prisma.payment.findMany({
      where: { tenantId, createdAt: { gte: start, lte: end } },
      include: { order: { select: { total: true } } },
    });

    const servedOrdersCount = payments.length;

    // Expected = sum of order totals that were paid today (authoritative price from DB)
    const expectedAmount = payments.reduce(
      (sum, p) => sum + Number(p.order?.total ?? 0),
      0,
    );

    // Cash only
    const cashPayments = payments.filter((p) => p.method === 'cash');

    // Gross cash received from customers (may include overpayment for change)
    const receivedCash = cashPayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );

    // Change given = excess cash returned when customer overpaid
    const changeGiven = cashPayments.reduce((sum, p) => {
      const orderTotal = Number(p.order?.total ?? 0);
      const paid = Number(p.amount);
      return sum + Math.max(0, paid - orderTotal);
    }, 0);

    // Variance = net cash in drawer - expected cash for cash orders
    // (should be 0 if cashier calculated change correctly; positive = surplus, negative = shortfall)
    const expectedCash = cashPayments.reduce(
      (sum, p) => sum + Number(p.order?.total ?? 0),
      0,
    );
    const variance = receivedCash - changeGiven - expectedCash;

    return {
      date,
      servedOrdersCount,
      expectedAmount,
      receivedCash,
      changeGiven,
      variance,
    };
  }

  async getUnpaidOrders(tenantId: string) {
    // Only ready/served orders without payment — pending/preparing aren't collectible yet
    return this.prisma.order.findMany({
      where: {
        tenantId,
        status: { in: ['ready', 'served'] },
        payment: null,
        deletedAt: null,
      },
      include: {
        orderItems: true,
        table: { select: { number: true } },
        customer: { select: { name: true, email: true } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ─── Cash register session lifecycle ─────────────────────────────────────

  async openSession(tenantId: string, userId: string, dto: OpenSessionDto) {
    // Backstop applicatif — la vraie garantie contre une double ouverture
    // concurrente est l'index unique partiel (WHERE status='open') posé par
    // la migration add_cash_register_session ; une violation ici remonte en
    // 409 via GlobalExceptionFilter (mapping P2002), même si ce check
    // applicatif est contourné par une race.
    const existing = await this.prisma.cashRegisterSession.findFirst({
      where: { tenantId, status: 'open' },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(
        "Une session de caisse est déjà ouverte pour ce restaurant. Clôturez-la avant d'en ouvrir une nouvelle.",
      );
    }

    return this.prisma.cashRegisterSession.create({
      data: {
        tenantId,
        openedBy: userId,
        openingAmount: dto.openingAmount,
        notes: dto.notes,
      },
      include: {
        openedByUser: { select: { id: true, name: true } },
      },
    });
  }

  async getCurrentSession(tenantId: string) {
    return this.prisma.cashRegisterSession.findFirst({
      where: { tenantId, status: 'open' },
      include: {
        openedByUser: { select: { id: true, name: true } },
      },
    });
  }

  async closeSession(tenantId: string, userId: string, dto: CloseSessionDto) {
    const session = await this.prisma.cashRegisterSession.findFirst({
      where: { tenantId, status: 'open' },
    });
    if (!session) {
      throw new NotFoundException(
        'Aucune session de caisse ouverte à clôturer.',
      );
    }

    const cashTotal = await this.prisma.payment.aggregate({
      where: { cashSessionId: session.id, method: 'cash' },
      _sum: { amount: true },
    });
    const totalCash = Number(cashTotal._sum.amount ?? 0);
    const expectedAmount = Number(session.openingAmount) + totalCash;
    const variance = dto.closingAmount - expectedAmount;

    return this.prisma.cashRegisterSession.update({
      where: { id: session.id, tenantId },
      data: {
        status: 'closed',
        closedBy: userId,
        closedAt: new Date(),
        closingAmount: dto.closingAmount,
        expectedAmount,
        variance,
        notes: dto.notes ?? session.notes,
      },
      include: {
        openedByUser: { select: { id: true, name: true } },
        closedByUser: { select: { id: true, name: true } },
      },
    });
  }

  async getSessionHistory(tenantId: string, page?: number, limit?: number) {
    const { skip, take, page: p, limit: l } = getSkipTake(page, limit);
    const where = { tenantId, status: 'closed' as const };

    const [data, total] = await Promise.all([
      this.prisma.cashRegisterSession.findMany({
        where,
        include: {
          openedByUser: { select: { id: true, name: true } },
          closedByUser: { select: { id: true, name: true } },
        },
        orderBy: { closedAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.cashRegisterSession.count({ where }),
    ]);

    return toPaginated(data, total, p, l);
  }
}
