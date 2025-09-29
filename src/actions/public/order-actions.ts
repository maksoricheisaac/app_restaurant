"use server";

import { actionClient } from "@/lib/safe-action";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { WHITELIST_IPS } from "@/config/rate-limits";
import { headers } from 'next/headers';
import { pusherServer } from "@/lib/pusher";

const orderSchema = z.object({
  orderType: z.enum(['dine_in', 'takeaway', 'delivery']),
  tableId: z.string().optional(),
  userId: z.string(),
  items: z.array(z.object({
    id: z.string(),
    name: z.string().max(100),
    quantity: z.number().int().positive().max(50),
    price: z.number().positive()
  })).min(1, "La commande doit contenir au moins un article"),
  // Champs spécifiques à la livraison
  deliveryZoneId: z.string().optional(),
  deliveryAddress: z.string().optional(),
  contactPhone: z.string().optional(),
});

class RateLimitError extends Error {
  constructor(
    message: string,
    public readonly window: string,
    public readonly limit: number,
    public readonly nextAllowedDate: Date
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

async function checkRateLimit(ipAddress: string): Promise<void> {
  // Vérifier si l'IP est en whitelist
  if (WHITELIST_IPS.some(whitelistedIp => whitelistedIp === ipAddress)) {
    return;
  }

  // Pour l'instant, on désactive la vérification de rate limit car le modèle n'existe pas
  // TODO: Implémenter la vérification de rate limit avec un modèle approprié
  console.log(`Rate limit check for IP: ${ipAddress}`);
}

export const createOrder = actionClient
  .inputSchema(orderSchema)
  .action(async ({ parsedInput }) => {
    // Log pour diagnostiquer le format de l'ID utilisateur reçu
    console.log("[order-actions] userId reçu:", parsedInput.userId);
    try {
      // Récupérer l'adresse IP du client
      let ipAddress = 'unknown';
      try {
        const headersList = await headers();
        ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] ||
          headersList.get('x-real-ip') ||
          'unknown';
      } catch (error) {
        console.error("Erreur lors de la récupération de l'IP:", error);
      }

      // Vérifier les limites de taux (log uniquement pour l'instant)
      await checkRateLimit(ipAddress);

      const { orderType, tableId, userId, items, deliveryZoneId, deliveryAddress, contactPhone } = parsedInput;

      // Vérifier que l'utilisateur existe
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error("Utilisateur non trouvé");
      }

      // Récupérer l'ID de la table si un numéro est fourni
      if (parsedInput.tableId && orderType === 'dine_in') {
        const table = await prisma.table.findUnique({
          where: { id: parsedInput.tableId }
        });

        if (!table) {
          throw new Error(`Table ${parsedInput.tableId} non trouvée`);
        }

        if (table.status !== 'available') {
          throw new Error(`Table ${parsedInput.tableId} n'est pas disponible`);
        }
      }

      // Validation spécifique selon le type de commande
      if (orderType === 'delivery') {
        if (!user.email) {
          throw new Error("L'email est obligatoire pour les livraisons");
        }

        const phoneToUse = user.phone || contactPhone;
        if (!phoneToUse) {
          throw new Error("Le téléphone est obligatoire pour les livraisons");
        }

        if (!deliveryZoneId) {
          throw new Error("La zone de livraison est requise pour les livraisons");
        }
        if (!deliveryAddress) {
          throw new Error("L'adresse de livraison est requise pour les livraisons");
        }
      }

      // Validation des prix côté serveur
      const menuItems = await prisma.menuItem.findMany({
        where: {
          id: {
            in: items.map((item) => item.id)
          }
        }
      });

      // Vérifier que les prix correspondent
      const invalidItems = items.filter((inputItem) => {
        const menuItem = menuItems.find(m => m.id === inputItem.id);
        return !menuItem || menuItem.price !== inputItem.price;
      });

      if (invalidItems.length > 0) {
        const invalidItemNames = invalidItems
          .map((item) => item.name)
          .join(", ");
        throw new Error(`Prix invalides pour les articles suivants : ${invalidItemNames}`);
      }

      // Calculer le total de la commande
      const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

      // Déterminer les informations de livraison et éventuels frais
      let deliveryFee: number | null = null;
      if (orderType === 'delivery') {
        const zone = await prisma.deliveryZone.findUnique({
          where: { id: deliveryZoneId! }
        });
        if (!zone || !zone.isActive) {
          throw new Error("Zone de livraison invalide ou inactive");
        }
        deliveryFee = zone.price;
      }

      // Créer la commande
      const order = await prisma.order.create({
        data: {
          type: orderType,
          status: "pending",
          total,
          userId: userId,
          tableId: tableId,
          deliveryZoneId: orderType === 'delivery' ? deliveryZoneId! : undefined,
          deliveryAddress: orderType === 'delivery' ? deliveryAddress! : undefined,
          deliveryFee: orderType === 'delivery' ? deliveryFee : undefined,
          orderItems: {
            create: items.map((item) => ({
              quantity: item.quantity,
              price: item.price,
              name: item.name,
              menuItemId: item.id
            }))
          }
        },
        include: {
          user: true,
          orderItems: true
        }
      });

      // Notifier via Pusher
      try {
        await pusherServer.trigger("restaurant-channel", "new-order", {
          order: {
            id: order.id,
            orderType: order.type,
            status: order.status,
            total: order.total,
            createdAt: order.createdAt,
            user: {
              name: user.name,
              email: user.email,
              phone: user.phone || contactPhone || undefined,
            },
            items: order.orderItems
          }
        });
      } catch (error) {
        console.error("Erreur lors de l'envoi de la notification Pusher:", error);
      }

      return {
        success: true,
        data: {
          orderId: order.id,
          order: order
        }
      };

    } catch (error) {
      console.error("Erreur lors de la création de la commande:", error);

      if (error instanceof RateLimitError) {
        return {
          success: false,
          error: error.message
        };
      }

      if (error instanceof Error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: false,
        error: "Une erreur inattendue s'est produite"
      };
    }
  });

const orderStatusSchema = z.object({
  orderId: z.string()
});

export const getOrderStatus = actionClient
  .inputSchema(orderStatusSchema)
  .action(async ({ parsedInput }) => {
    try {
      const order = await prisma.order.findUnique({
        where: { id: parsedInput.orderId },
        select: {
          id: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          orderItems: {
            select: {
              name: true,
              quantity: true,
              price: true
            }
          }
        }
      });
      
      return { order };
    } catch (error) {
      console.error("Erreur lors de la récupération du statut de la commande:", error);
      throw new Error("Impossible de récupérer le statut de la commande.");
    }
  }); 

export const getAvailableTables = actionClient
  .inputSchema(z.void())
  .action(async () => {
    try {
      const tables = await prisma.table.findMany({
        where: { 
          status: 'available'
        },
        orderBy: {
          number: 'asc'
        },
        select: {
          id: true,
          number: true,
          seats: true
        }
      });
      
      return { tables };
    } catch (error) {
      console.error("Erreur lors de la récupération des tables:", error);
      throw new Error("Impossible de récupérer la liste des tables.");
    }
  }); 