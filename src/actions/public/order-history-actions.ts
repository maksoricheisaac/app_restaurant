"use server";

import { actionClient } from "@/lib/safe-action";
import prisma from "@/lib/prisma";
import { z } from "zod";

const orderHistorySchema = z.object({
  userEmail: z.string().email(),
});

export const getOrderHistory = actionClient
  .inputSchema(orderHistorySchema)
  .action(async ({ parsedInput }) => {
    try {
      // Query orders by the user's email (the frontend passes email)
      const orders = await prisma.order.findMany({
        where: {
          user: {
            email: parsedInput.userEmail,
          }
        },
        include: {
          orderItems: true,
          user: true,
          table: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Transformer les données pour correspondre au format attendu
      const transformedOrders = orders.map(order => ({
        id: order.id,
        status: order.status,
        type: order.type,
        total: order.total || 0,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: order.orderItems.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          image: item.image,
        })),
        customer: {
          firstName: order.user?.name.split(' ')[0] || '',
          lastName: order.user?.name.split(' ')[1] || '',
          email: order.user?.email || '',
          phone: order.user?.phone || '',
          address: order.user?.address || '',
          notes: order.user?.notes || '',
        },
        tableNumber: order.table?.number || undefined,
        tableId: order.tableId,
      }));

      return { 
        success: true, 
        data: transformedOrders 
      };
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique des commandes:', error);
      return { 
        success: false, 
        error: "Erreur lors de la récupération de l'historique des commandes",
        data: []
      };
    }
  }); 