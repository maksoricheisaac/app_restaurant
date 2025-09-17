"use server";
import { z } from "zod";
import { actionClient } from "@/lib/safe-action";
import prisma from "@/lib/prisma";
import type { OrderItem } from "@/generated/prisma";

const trackingSchema = z.object({ orderId: z.string() });

export const getOrderTracking = actionClient
  .inputSchema(trackingSchema)
  .action(async ({ parsedInput }) => {
    try {
      
      const order = await prisma.order.findUnique({
        where: { id: parsedInput.orderId },
        include: {
          orderItems: true,
          user: true,
          table: true,
        },
      });
      
      if (!order) {
        throw new Error("Commande introuvable. Vérifiez le numéro de commande.");
      }
      
      // Mapping pour correspondre au type Order du front
      const mappedOrder = {
        id: order.id,
        userId: order.userId,
        user: order.user ? {
          id: order.user.id,
          name: order.user.name,
          email: order.user.email,
          phone: order.user.phone,
        } : {
          id: '',
          name: '',
          email: '',
          phone: null,
        },
        orderItems: order.orderItems.map((item: OrderItem) => ({
          id: item.id,
          orderId: item.orderId,
          menuItemId: item.menuItemId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          image: item.image,
        })),
        total: order.total || 0,
        status: order.status,
        type: order.type,
        tableId: order.tableId,
        table: order.table ? {
          id: order.table.id,
          number: order.table.number,
          seats: order.table.seats,
        } : null,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        // Propriétés additionnelles pour ExtendedOrder
        email: order.user?.email || '',
        phone: order.user?.phone || '',
        time: order.createdAt.toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        date: order.createdAt,
        subtotal: (order.total || 0) * 0.9, // Estimation (total sans TVA)
        tax: (order.total || 0) * 0.1,      // Estimation de la TVA
        taxRate: 0.1,
        deliveryFee: order.type === 'delivery' ? 5 : undefined,
        tip: 0,
      };
      
      return { data: { order: mappedOrder } };
    } catch(error) {
      if(error instanceof Error){
        throw new Error("Une erreur est survenue lors de la récupération de la commande.")
      }
      throw error;
    }
}); 