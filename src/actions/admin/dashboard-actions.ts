"use server";

import prisma from "@/lib/prisma";
import { actionClient } from "@/lib/safe-action";
import { z } from "zod";
import { startOfDay, endOfDay } from "date-fns";
import type { Order } from "@/types/order";

// Schema pour la date de filtrage
const dateFilterSchema = z.object({
  date: z.string().optional(), // Format YYYY-MM-DD
});

// Schema pour la pagination des commandes
const ordersFilterSchema = z.object({
  page: z.number().default(1),
  perPage: z.number().default(10),
  status: z.enum(["pending", "preparing", "ready", "served", "cancelled"]).optional(),
});

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  activeCustomers: number;
  totalReservations: number;
}

interface OrdersResponse {
  orders: Order[];
  pagination: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

// Récupération des statistiques du dashboard
export const getDashboardStats = actionClient
  .inputSchema(dateFilterSchema)
  .action(async ({ parsedInput }) => {
    const { date } = parsedInput;
    try {
      const targetDate = date ? new Date(date) : new Date();
      const start = startOfDay(targetDate);
      const end = endOfDay(targetDate);

      // Récupérer les commandes du jour
      const orders = await prisma.order.findMany({
        where: {
          createdAt: { gte: start, lte: end },
        },
      });

      // Récupérer les réservations du jour
      const reservations = await prisma.reservation.findMany({
        where: {
          date: { gte: start, lte: end },
        },
      });

      // Récupérer les clients actifs du jour (ayant au moins une commande servie)
      const activeCustomers = await prisma.user.findMany({
        where: {
          orders: {
            some: {
              createdAt: { gte: start, lte: end },
            },
          },
        },
        select: { id: true }, // on ne récupère que l'id pour compter
      });

      const stats: DashboardStats = {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, order) => sum + (order.total || 0), 0),
        activeCustomers: activeCustomers.length,
        totalReservations: reservations.length,
      };

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques:", error);
      return {
        success: false,
        error: "Erreur lors de la récupération des statistiques",
      };
    }
  });

// Récupération des dernières commandes
export const getLatestOrders = actionClient
  .inputSchema(ordersFilterSchema)
  .action(async ({ parsedInput }) => {
    const { page, perPage, status } = parsedInput;
    try {
      // Récupérer les commandes d'aujourd'hui
      const today = new Date()
      const start = startOfDay(today)
      const end = endOfDay(today)

      const where = {
        ...(status ? { status } : {}),
        createdAt: {
          gte: start,
          lte: end,
        },
      };

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
            orderItems: true,
            table: {
              select: {
                id: true,
                number: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          skip: (page - 1) * perPage,
          take: perPage,
        }),
        prisma.order.count({ where }),
      ]);

      const response: OrdersResponse = {
        orders: orders as Order[],
        pagination: {
          total,
          page,
          perPage,
          totalPages: Math.ceil(total / perPage),
        },
      };

      return {
        success: true,
        data: response,
      };
    } catch (error) {
      console.error("Erreur lors de la récupération des commandes:", error);
      return {
        success: false,
        error: "Erreur lors de la récupération des commandes",
      };
    }
  });

export async function getAdminSidebarCounts() {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const [pendingOrders, unreadMessages, pendingReservations] = await Promise.all([
    prisma.order.count({ 
      where: { 
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
        status: "pending",
      } 
    }),
    prisma.message.count({ 
      where: { 
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
        status: "new",
      } 
    }),
    prisma.reservation.count({ 
      where: { 
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
        status: "pending"
      }
    }),
  ]);
  
  return {
    pendingOrders,
    unreadMessages,
    pendingReservations,
  };
} 

