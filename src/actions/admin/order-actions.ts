"use server";

import { actionClient } from "@/lib/safe-action";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { pusherServer } from "@/lib/pusher";
import { Prisma } from "@/generated/prisma";

// Schema for order item validation
const orderItemSchema = z.object({
  name: z.string().min(1, "Le nom de l'article est requis"),
  quantity: z.number().min(1, "La quantité doit être au moins 1"),
  price: z.number().positive("Le prix doit être positif"),
  image: z.string().optional(),
  menuItemId: z.string().optional(), // Optionnel car les articles peuvent être ajoutés manuellement
});

// Schema for order validation
const orderSchema = z.object({
  // userId optional: staff can create orders without linking a registered user
  userId: z.string().cuid("Invalid user ID").optional(),
  tableId: z.string().uuid("Invalid table ID").optional(),
  status: z.enum(["pending", "preparing", "ready", "served", "cancelled"]),
  type: z.enum(["dine_in", "takeaway", "delivery"]),
  total: z.number().positive("Le total doit être positif"),
  items: z.array(orderItemSchema).min(1, "La commande doit contenir au moins un article"),
  // Champs optionnels pour les commandes créées par le personnel
  email: z.string().email("Email invalide").optional(),
  phone: z.string().optional(),
});

// Get all orders
export const getOrders = actionClient
  .inputSchema(z.void())
  .action(async () => {
    try {
      const orders = await prisma.order.findMany({
        include: {
          user: true,
          orderItems: true,
          table: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      
      return { success: true, data: orders };
    } catch (error) {
      console.error('Erreur lors de la récupération des commandes:', error);
      throw new Error('Impossible de charger les commandes pour le moment.');
    }
  });

// Get order by ID
export const getOrderById = actionClient
  .inputSchema(z.object({
    id: z.string().uuid("Invalid order ID"),
  }))
  .action(async ({ parsedInput: { id } }) => {
    try {
      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          user: true,
          orderItems: true,
          table: true,
        },
      });
      
      if (!order) {
        throw new Error('Commande non trouvée');
      }
      
      return { success: true, data: order };
    } catch (error) {
      console.error('Erreur lors de la récupération de la commande:', error);
      throw new Error('Impossible de charger la commande pour le moment.');
    }
  });

// Create order
export const createOrder = actionClient
  .inputSchema(orderSchema)
  .action(async ({ parsedInput }) => {
    try {
      let userIdToUse = parsedInput.userId;
      // If no userId provided, create an anonymous guest user record
      if (!userIdToUse) {
        try {
          const { randomUUID } = await import('crypto');
          const guestId = randomUUID();
          const guestEmail = `guest+${Date.now()}@local`;
          const guest = await prisma.user.create({
            data: {
              id: guestId,
              name: 'Client (saisi par le personnel)',
              email: guestEmail,
              emailVerified: false,
              role: 'guest',
              phone: parsedInput.phone || null,
              address: null,
              status: 'active',
              isDeleted: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            }
          });
          userIdToUse = guest.id;
        } catch (userCreateError) {
          console.error('Erreur lors de la création de l\'utilisateur invité:', userCreateError);
          throw new Error('Impossible de créer un utilisateur invité pour la commande.');
        }
      }
      const order = await prisma.order.create({
        data: {
          userId: userIdToUse,
          tableId: parsedInput.tableId,
          status: parsedInput.status,
          type: parsedInput.type,
          total: parsedInput.total,
        },
        include: {
          user: true,
          orderItems: true,
          table: true,
        },
      });

      // Notification en temps réel via Pusher
      try {
        await pusherServer.trigger('admin-orders', 'new-order', {
          order: {
            id: order.id,
            status: order.status,
            type: order.type,
            total: order.total,
            createdAt: order.createdAt,
            user: order.user,
            orderItems: order.orderItems,
          }
        });
      } catch (pusherError) {
        console.error('Erreur Pusher:', pusherError);
      }

      return { success: true, data: order };
    } catch (error) {
      console.error('Erreur lors de la création de la commande:', error);
      throw new Error('Impossible de créer la commande pour le moment.');
    }
  });

// Update order
export const updateOrder = actionClient
  .inputSchema(orderSchema.extend({
    id: z.string().uuid("Invalid order ID"),
  }))
  .action(async ({ parsedInput: { id, ...data } }) => {
    try {
      const updateData: Record<string, any> = {
        tableId: data.tableId,
        status: data.status,
        type: data.type,
        total: data.total,
      };
      if (data.userId) updateData.userId = data.userId;

      const order = await prisma.order.update({
        where: { id },
        data: updateData,
        include: {
          user: true,
          orderItems: true,
          table: true,
        },
      });

      // Notification en temps réel via Pusher
      try {
        await pusherServer.trigger('admin-orders', 'order-updated', {
          order: {
            id: order.id,
            status: order.status,
            type: order.type,
            total: order.total,
            updatedAt: order.updatedAt,
            user: order.user,
            orderItems: order.orderItems,
          }
        });
      } catch (pusherError) {
        console.error('Erreur Pusher:', pusherError);
      }

      return { success: true, data: order };
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la commande:', error);
      throw new Error('Impossible de mettre à jour la commande pour le moment.');
    }
  });

// Delete order
export const deleteOrder = actionClient
  .inputSchema(z.object({
    id: z.string().uuid("Invalid order ID"),
  }))
  .action(async ({ parsedInput: { id } }) => {
    try {
      await prisma.order.delete({
        where: { id },
      });

      // Notification en temps réel via Pusher
      try {
        await pusherServer.trigger('admin-orders', 'order-deleted', {
          orderId: id
        });
      } catch (pusherError) {
        console.error('Erreur Pusher:', pusherError);
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la suppression de la commande:', error);
      throw new Error('Impossible de supprimer la commande pour le moment.');
    }
  });

// Get orders with pagination and filters
export const getOrdersWithFilters = actionClient
  .inputSchema(z.object({
    page: z.number().min(1),
    limit: z.number().min(1).max(100),
    search: z.string().optional(),
  status: z.enum(["pending", "preparing", "ready", "served", "cancelled"]).optional(),
    type: z.enum(["dine_in", "takeaway", "delivery"]).optional(),
    date: z.string().optional(),
  }))
  .action(async ({ parsedInput: { page, limit, search, status, type, date } }) => {
    try {
      const skip = (page - 1) * limit;

      // Construire les filtres
      const where: Prisma.OrderWhereInput = {};
      
      if (search) {
        where.OR = [
          { user: { name: { contains: search, mode: "insensitive" as const } } },
          { user: { email: { contains: search, mode: "insensitive" as const } } },
        ];
      }
      
      if (status) {
        where.status = status;
      }
      
      if (type) {
        where.type = type;
      }
      
      if (date) {
        const targetDate = new Date(date);
        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);
        
        where.createdAt = {
          gte: targetDate,
          lt: nextDay,
        };
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            user: true,
            orderItems: true,
            table: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limit,
        }),
        prisma.order.count({ where }),
      ]);

      return {
        success: true,
        data: {
          orders,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des commandes filtrées:', error);
      throw new Error('Impossible de charger les commandes pour le moment.');
    }
  });

// Get available tables
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
      
      return { success: true, data: tables };
    } catch (error) {
      console.error("Erreur lors de la récupération des tables:", error);
      throw new Error("Impossible de récupérer la liste des tables.");
    }
  }); 

// Update order status
export const updateOrderStatus = actionClient
  .inputSchema(z.object({
    orderId: z.string().uuid("Invalid order ID"),
    status: z.enum(["pending", "preparing", "ready", "served", "cancelled"]),
  }))
  .action(async ({ parsedInput: { orderId, status } }) => {
    try {
      // Récupérer la commande actuelle pour vérifier le statut précédent
      const currentOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          orderItems: {
            include: {
              menuItem: {
                include: {
                  Recipe: {
                    include: {
                      ingredient: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!currentOrder) {
        throw new Error('Commande non trouvée');
      }

      // Mettre à jour le statut de la commande
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status },
        include: {
          user: true,
          orderItems: true,
          table: true,
        },
      });

      // Décrementation automatique des stocks si la commande passe en "preparing"
      // et qu'elle n'était pas déjà en "preparing" ou un statut ultérieur
      const shouldDecrementStock = 
        status === "preparing" && 
        ["preparing", "ready", "served"].includes(currentOrder.status) === false;

      if (shouldDecrementStock) {
        try {
          // Importer la fonction de décrementation des stocks
          const { decrementStockForOrder } = await import("./inventory-actions");
          await decrementStockForOrder({ orderId });
          console.log(`Stock décrementé automatiquement pour la commande ${orderId}`);
        } catch (stockError) {
          console.error('Erreur lors de la décrementation du stock:', stockError);
          // Ne pas faire échouer la mise à jour du statut si la décrementation échoue
          // mais loguer l'erreur pour investigation
        }
      }

      // Notification en temps réel via Pusher
      try {
        await pusherServer.trigger('admin-orders', 'order-status-updated', {
          orderId,
          status,
          order: updatedOrder,
        });
        // Broadcast pour le tracking public (page order-tracking)
        await pusherServer.trigger('restaurant-channel', 'order-status-updated', {
          orderId,
          status,
        });
      } catch (pusherError) {
        console.error('Erreur Pusher lors de la mise à jour du statut:', pusherError);
      }

      return { success: true, data: updatedOrder };
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut de la commande:', error);
      throw new Error('Impossible de mettre à jour le statut de la commande.');
    }
  }); 