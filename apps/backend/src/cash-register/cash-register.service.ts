import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { TransactionFiltersDto } from './dto/transaction-filters.dto';
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
      // 1. Create payment
      const payment = await tx.payment.create({
        data: { tenantId, orderId, amount, method, cashierId },
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
    const end   = new Date(`${date}T23:59:59.999`);

    // All payments processed today for this tenant
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
      const paid       = Number(p.amount);
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
        user:     { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
