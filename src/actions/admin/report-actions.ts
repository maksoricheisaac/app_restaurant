"use server";

import { actionClient } from "@/lib/safe-action";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  startOfDay, 
  endOfDay, 
  startOfYear, 
  endOfYear,
  format,
  eachDayOfInterval,
  eachMonthOfInterval,
  eachHourOfInterval
} from "date-fns";
import { fr } from "date-fns/locale";

// Schema pour les filtres de période
const periodFilterSchema = z.object({
  type: z.enum(['daily', 'weekly', 'monthly', 'yearly']).default('monthly'),
  date: z.string().optional(),
});

// Calculer les métriques pour une période donnée
export const calculateMetrics = actionClient
  .inputSchema(periodFilterSchema)
  .action(async ({ parsedInput: { type, date } }) => {
    try {
      const targetDate = date ? new Date(date) : new Date();
      let startDate: Date;
      let endDate: Date;

      // Déterminer la période selon le type
      switch (type) {
        case 'daily':
          startDate = startOfDay(targetDate);
          endDate = endOfDay(targetDate);
          break;
        case 'weekly':
          startDate = startOfWeek(targetDate, { weekStartsOn: 1 }); // Lundi
          endDate = endOfWeek(targetDate, { weekStartsOn: 1 }); // Dimanche
          break;
        case 'monthly':
          startDate = startOfMonth(targetDate);
          endDate = endOfMonth(targetDate);
          break;
        case 'yearly':
          startDate = startOfYear(targetDate);
          endDate = endOfYear(targetDate);
          break;
        default:
          startDate = startOfMonth(targetDate);
          endDate = endOfMonth(targetDate);
      }

     

    


      // Récupérer les commandes de la période (inclure tous les statuts pour l'instant)
      const orders = await prisma.order.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          status: 'served',   
        },
        include: {
          user: true,
          orderItems: true,
        },
      });

     

      // Calculer les métriques de base
      const revenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
      const ordersCount = orders.length;
      const customers = new Set(orders.map(order => order.userId).filter(Boolean)).size;
      const avgOrder = ordersCount > 0 ? Math.round(revenue / ordersCount) : 0;

      

      // Récupérer les plats les plus vendus (top 3 seulement)
      const topDishes = await prisma.orderItem.groupBy({
        by: ['name'],
        where: {
          order: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
            status: 'served',
          },
        },
        _sum: {
          quantity: true,
        },
        orderBy: {
          _sum: {
            quantity: 'desc',
          },
        },
        take: 3,
      });


      const metrics = {
        revenue,
        orders: ordersCount,
        customers,
        avgOrder,
        topDishes: topDishes.map(dish => ({
          name: dish.name,
          orders: dish._sum.quantity || 0,
        })),
        period: {
          start: startDate,
          end: endDate,
          type,
        },
      };

      

      return { success: true, data: metrics };
    } catch (error) {
      console.error('❌ Erreur lors du calcul des métriques:', error);
      throw new Error('Impossible de calculer les métriques pour le moment.');
    }
  });

// Récupérer les données pour les graphiques
export const getChartData = actionClient
  .inputSchema(periodFilterSchema)
  .action(async ({ parsedInput: { type, date } }) => {
    try {
      const targetDate = date ? new Date(date) : new Date();
      let startDate: Date;
      let endDate: Date;
      let intervals: Date[];

      // Déterminer la période selon le type
      switch (type) {
        case 'daily':
          startDate = startOfDay(targetDate);
          endDate = endOfDay(targetDate);
          intervals = eachHourOfInterval({ start: startDate, end: endDate });
          break;
        case 'weekly':
          startDate = startOfWeek(targetDate, { weekStartsOn: 1 });
          endDate = endOfWeek(targetDate, { weekStartsOn: 1 });
          intervals = eachDayOfInterval({ start: startDate, end: endDate });
          break;
        case 'monthly':
          startDate = startOfMonth(targetDate);
          endDate = endOfMonth(targetDate);
          intervals = eachDayOfInterval({ start: startDate, end: endDate });
          break;
        case 'yearly':
          startDate = startOfYear(targetDate);
          endDate = endOfYear(targetDate);
          intervals = eachMonthOfInterval({ start: startDate, end: endDate });
          break;
        default:
          startDate = startOfMonth(targetDate);
          endDate = endOfMonth(targetDate);
          intervals = eachDayOfInterval({ start: startDate, end: endDate });
      }

      // Récupérer les commandes pour chaque intervalle
      const chartData = await Promise.all(
        intervals.map(async (interval) => {
          const intervalStart = type === 'yearly' ? startOfMonth(interval) : type === 'daily' ? interval : startOfDay(interval);
          const intervalEnd = type === 'yearly' ? endOfMonth(interval) : type === 'daily' ? new Date(interval.getTime() + 60 * 60 * 1000 - 1) : endOfDay(interval);

          const orders = await prisma.order.findMany({
            where: {
              createdAt: {
                gte: intervalStart,
                lte: intervalEnd,
              },
              status: 'served',
            },
          });

          const revenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
          const ordersCount = orders.length;

          return {
            date: format(interval, type === 'yearly' ? 'MMM yyyy' : type === 'daily' ? 'HH:mm' : 'dd/MM', { locale: fr }),
            revenue,
            orders: ordersCount,
          };
        })
      );

      return { success: true, data: chartData };
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des données graphiques:', error);
      throw new Error('Impossible de récupérer les données graphiques.');
    }
  }); 