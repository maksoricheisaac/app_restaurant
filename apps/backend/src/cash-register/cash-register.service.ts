import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { TransactionFiltersDto } from './dto/transaction-filters.dto';

@Injectable()
export class CashRegisterService {
  constructor(private prisma: PrismaService) {}

  async processPayment(tenantId: string, data: ProcessPaymentDto & { cashierId: string }) {
    const { orderId, amount, method, cashierId } = data;

    return this.prisma.$transaction(async (tx) => {
      // 1. Créer le paiement
      const payment = await tx.payment.create({
        data: {
          tenantId,
          orderId,
          amount,
          method,
          cashierId,
        },
      });

      // 2. Créer la transaction de vente
      await tx.transaction.create({
        data: {
          tenantId,
          type: 'sale',
          amount,
          method,
          cashierId,
          orderId,
          description: `Paiement commande ${orderId}`,
        },
      });

      // 3. Mettre à jour le statut de la commande
      await tx.order.update({
        where: { id: orderId, tenantId },
        data: { status: 'served' },
      });

      return payment;
    });
  }

  async getTransactions(tenantId: string, filters: TransactionFiltersDto) {
    const { dateFrom, dateTo, type, cashierId } = filters;
    return this.prisma.transaction.findMany({
      where: {
        tenantId,
        ...(type ? { type } : {}),
        ...(cashierId ? { cashierId } : {}),
        createdAt: {
          ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
          ...(dateTo ? { lte: new Date(dateTo) } : {}),
        },
      },
      include: {
        cashier: { select: { name: true } },
        order: { select: { total: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBilan(tenantId: string, date: string) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const stats = await this.prisma.transaction.aggregate({
      where: {
        tenantId,
        createdAt: { gte: start, lte: end },
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    return {
      date,
      totalRevenue: stats._sum.amount || 0,
      transactionCount: stats._count.id,
    };
  }

  async getUnpaidOrders(tenantId: string) {
    return this.prisma.order.findMany({
      where: {
        tenantId,
        status: { in: ['pending', 'preparing', 'ready', 'served'] },
        payment: null,
      },
      include: {
        orderItems: true,
        table: { select: { number: true } },
        customer: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
