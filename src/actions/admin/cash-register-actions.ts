"use server";
import { PaymentMethod } from "@/types/order";
import { revalidatePath } from "next/cache";
import z from "zod";
import { actionClient } from "@/lib/safe-action";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth-helpers";

// Schémas de validation
const processPaymentSchema = z.object({
  orderId: z.string(),
  amount: z.number().positive(),
  method: z.enum(["cash"]).default("cash"),
  reference: z.string().optional(),
});


const createTransactionSchema = z.object({
  type: z.enum(["sale", "refund", "adjustment"]),
  amount: z.number(),
  method: z.enum(["cash"]).default("cash"),
  description: z.string().optional(),
  orderId: z.string().optional(),
});

const getCashRegisterStatsSchema = z.object({
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  cashierId: z.string().optional(),
});

const getTransactionsSchema = z.object({
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  cashierId: z.string().optional(),
  paymentMethod: z.enum(["cash"]).optional(),
  transactionType: z.enum(["sale", "refund", "adjustment"]).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

// Action pour traiter un paiement
export const processPayment = actionClient
  .inputSchema(processPaymentSchema)
  .action(async ({ parsedInput }) => {
    const { session } = await requireRole(['cashier', 'admin', 'owner', 'manager']);

    const { orderId, amount, reference } = parsedInput;

    // Vérifier que la commande existe et n'est pas déjà payée
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      throw new Error("Commande introuvable");
    }

    if (order.payment) {
      throw new Error("Cette commande a déjà été payée");
    }

    // Workflow: seules les commandes servies sont encaissables
    if (order.status !== "served") {
      throw new Error("Seules les commandes servies peuvent être encaissées");
    }

    // Vérifier montant suffisant
    const total = order.total ?? 0;
    if (typeof total !== "number" || total <= 0) {
      throw new Error("Total de la commande invalide");
    }
    if (amount < total) {
      throw new Error("Le montant reçu est insuffisant");
    }

    // Créer le paiement (cash-only)
    const payment = await prisma.payment.create({
      data: {
        orderId,
        amount,
        method: "cash",
        reference,
        cashierId: session.user.id,
        status: "completed",
      },
      include: {
        order: {
          include: {
            orderItems: {
              include: {
                menuItem: true,
              },
            },
            user: true,
            table: true,
          },
        },
        cashier: true,
      },
    });

    // Ne pas changer le statut de la commande: elle reste "served"

    // Créer une transaction (vente)
    await prisma.transaction.create({
      data: {
        type: "sale",
        amount,
        method: "cash",
        description: `Paiement commande #${orderId.slice(-6).toUpperCase()}`,
        cashierId: session.user.id,
        orderId,
      },
    });

    revalidatePath("/admin/cash-register");
    revalidatePath("/admin/orders");

    return { success: true, payment };
  });

// Action pour créer une transaction
export const createTransaction = actionClient
  .inputSchema(createTransactionSchema)
  .action(async ({ parsedInput }) => {
    const { session } = await requireRole(['cashier', 'admin', 'owner', 'manager']);

    const { type, amount, method, description, orderId } = parsedInput;

    const transaction = await prisma.transaction.create({
      data: {
        type,
        amount,
        method,
        description,
        cashierId: session.user.id,
        orderId,
      },
      include: {
        order: {
          include: {
            user: true,
            table: true,
          },
        },
        cashier: true,
      },
    });

    revalidatePath("/admin/cash-register");

    return { success: true, transaction };
  });

// Action pour obtenir les statistiques de caisse
export const getCashRegisterStats = actionClient
  .inputSchema(getCashRegisterStatsSchema)
  .action(async ({ parsedInput }) => {
    await requireRole(['cashier', 'admin', 'owner', 'manager']);

    const { dateFrom, dateTo, cashierId } = parsedInput;

    // Construire les filtres de date
    const dateFilter: { createdAt?: { gte?: Date; lte?: Date } } = {};
    if (dateFrom || dateTo) {
      dateFilter.createdAt = {};
      if (dateFrom) dateFilter.createdAt.gte = dateFrom;
      if (dateTo) dateFilter.createdAt.lte = dateTo;
    }

    // Construire les filtres de caissier
    const cashierFilter = cashierId ? { cashierId } : {};

    // Obtenir les transactions (ventes)
    const transactions = await prisma.transaction.findMany({
      where: {
        ...dateFilter,
        ...cashierFilter,
        type: "sale",
      },
      include: {
        cashier: true,
      },
    });

    // Calculer les statistiques
    const totalSales = transactions.reduce((sum, t) => sum + t.amount, 0);
    const totalTransactions = transactions.length;

    // Ventes par méthode de paiement
    const salesByMethod: Record<PaymentMethod, number> = {
      cash: 0,
    };

    transactions.forEach((t) => {
      salesByMethod["cash"] += t.amount;
    });

    // Ventes par heure
    const salesByHour: Record<string, number> = {};
    transactions.forEach((t) => {
      const hour = new Date(t.createdAt).getHours().toString().padStart(2, "0");
      salesByHour[hour] = (salesByHour[hour] || 0) + t.amount;
    });

    // Remboursements et ajustements (période)
    const refunds = await prisma.transaction.findMany({
      where: {
        ...dateFilter,
        ...cashierFilter,
        type: "refund",
      },
    });

    const adjustments = await prisma.transaction.findMany({
      where: {
        ...dateFilter,
        ...cashierFilter,
        type: "adjustment",
      },
    });

    const totalRefunds = refunds.reduce((sum, t) => sum + t.amount, 0);
    const totalAdjustments = adjustments.reduce((sum, t) => sum + t.amount, 0);
    const netSales = totalSales - totalRefunds + totalAdjustments;

    // Statistiques du jour
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTransactions = await prisma.transaction.findMany({
      where: {
        ...cashierFilter,
        type: "sale",
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const todaySales = todayTransactions.reduce((sum, t) => sum + t.amount, 0);

    return {
      totalSales,
      totalTransactions,
      salesByMethod,
      salesByHour,
      todaySales,
      todayTransactions: todayTransactions.length,
      totalRefunds,
      totalAdjustments,
      netSales,
    };
  });

// Action pour obtenir les transactions
export const getTransactions = actionClient
  .inputSchema(getTransactionsSchema)
  .action(async ({ parsedInput }) => {
    await requireRole(['cashier', 'admin', 'owner', 'manager']);

    const {
      dateFrom,
      dateTo,
      cashierId,
      paymentMethod,
      transactionType,
      page,
      limit,
    } = parsedInput;

    // Construire les filtres
    const where: {
      createdAt?: { gte?: Date; lte?: Date };
      cashierId?: string;
      method?: PaymentMethod;
      type?: "sale" | "refund" | "adjustment";
    } = {};

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    if (cashierId) where.cashierId = cashierId;
    if (paymentMethod) where.method = paymentMethod;
    if (transactionType) where.type = transactionType;

    // Compter le total
    const total = await prisma.transaction.count({ where });

    // Obtenir les transactions avec pagination
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        order: {
          include: {
            user: true,
            table: true,
          },
        },
        cashier: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  });

// Action pour exporter les transactions en CSV
export const exportTransactionsCSV = actionClient
  .inputSchema(getTransactionsSchema)
  .action(async ({ parsedInput }) => {
    await requireRole(['cashier', 'admin', 'owner', 'manager']);

    const {
      dateFrom,
      dateTo,
      cashierId,
      paymentMethod,
      transactionType,
    } = parsedInput;

    const where: {
      createdAt?: { gte?: Date; lte?: Date };
      cashierId?: string;
      method?: PaymentMethod;
      type?: "sale" | "refund" | "adjustment";
    } = {};

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }
    if (cashierId) where.cashierId = cashierId;
    if (paymentMethod) where.method = paymentMethod;
    if (transactionType) where.type = transactionType;

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        order: { include: { user: true, table: true } },
        cashier: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const header = [
      "date",
      "type",
      "method",
      "amount",
      "cashier",
      "orderId",
      "customer",
      "table",
      "description",
    ];

    const escapeCsv = (value: string) =>
      `"${value.replace(/"/g, '""')}"`;

        type TransactionWithIncludes = (typeof transactions)[0];

    const rows = transactions.map((t: TransactionWithIncludes) => [
      t.createdAt.toISOString(),
      t.type,
      t.method,
      String(t.amount),
      t.cashier?.name ?? "",
      t.orderId ?? "",
      t.order?.user?.name ?? "",
      t.order?.table?.number != null ? String(t.order.table.number) : "",
      (t.description ?? "").replace(/\r?\n/g, " "),
    ]);

    const csv = [header, ...rows]
      .map((r) => r.map((v) => escapeCsv(String(v))).join(","))
      .join("\n");

    return {
      filename: `transactions_${Date.now()}.csv`,
      csv,
      count: transactions.length,
    };
  });

// Bilan quotidien de caisse (commandes servies vs paiements reçus)
export const getDailyCashSummary = actionClient
  .inputSchema(z.object({ date: z.date().optional() }))
  .action(async ({ parsedInput }) => {
    await requireRole(['cashier', 'admin', 'owner', 'manager']);

    const targetDate = parsedInput.date ? new Date(parsedInput.date) : new Date();
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    // Montant attendu: somme des totaux des commandes servies du jour
    const servedOrders = await prisma.order.findMany({
      where: { status: "served", createdAt: { gte: dayStart, lte: dayEnd } },
      select: { id: true, total: true },
    });
    const servedOrdersCount = servedOrders.length;
    const expectedAmount = servedOrders.reduce((sum, o) => sum + (o.total ?? 0), 0);

    // Montant reçu: paiements complétés du jour (espèces uniquement)
    const payments = await prisma.payment.findMany({
      where: { status: "completed", createdAt: { gte: dayStart, lte: dayEnd } },
      select: { amount: true, method: true, order: { select: { total: true } } },
    });

    const receivedCash = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    
    // Calculer la monnaie remise (différence entre montant reçu et total de la commande)
    const changeGiven = payments.reduce((sum, p) => {
      const orderTotal = p.order?.total ?? 0;
      const change = (p.amount || 0) - orderTotal;
      return sum + (change > 0 ? change : 0);
    }, 0);
    
    const variance = receivedCash - changeGiven - expectedAmount;

    return {
      date: dayStart.toLocaleDateString("fr-CA"),
      servedOrdersCount,
      expectedAmount,
      receivedCash,
      changeGiven,
      variance,
    };
  });

// Action pour obtenir les commandes non payées
export const getUnpaidOrders = actionClient
  .inputSchema(z.object({ date: z.date().optional() }))
  .action(async ({ parsedInput }) => {
    await requireRole(['cashier', 'admin', 'owner', 'manager']);

    const targetDate = parsedInput.date ? new Date(parsedInput.date) : new Date();
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const orders = await prisma.order.findMany({
      where: {
        status: "served",
        payment: null,
        createdAt: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
      include: {
        orderItems: {
          include: {
            menuItem: true,
          },
        },
        user: true,
        table: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return { orders };
  });