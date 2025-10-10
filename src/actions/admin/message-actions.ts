"use server";

import { actionClient } from "@/lib/safe-action";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { pusherServer } from "@/lib/pusher";
import { Prisma } from "@/generated/prisma";
import { requireStaff } from "@/lib/auth-helpers";

// Schema for message validation
const messageSchema = z.object({
  customerName: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(1, "Le message est requis"),
  type: z.string().optional(),
  priority: z.string().optional(),
  status: z.enum(["new", "read", "replied", "closed"]).default("new"),
  source: z.string().default("contact-form"),
});

// Get all messages
export const getMessages = actionClient
  .inputSchema(z.void())
  .action(async () => {
    try {
      await requireStaff();
      const messages = await prisma.message.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });
      
      return { success: true, data: messages };
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error);
      throw new Error('Impossible de charger les messages pour le moment.');
    }
  });

// Get message by ID
export const getMessageById = actionClient
  .inputSchema(z.object({
    id: z.string().uuid("Invalid message ID"),
  }))
  .action(async ({ parsedInput: { id } }) => {
    try {
      await requireStaff();
      const message = await prisma.message.findUnique({
        where: { id },
      });
      
      if (!message) {
        throw new Error('Message non trouvé');
      }
      
      return { success: true, data: message };
    } catch (error) {
      console.error('Erreur lors de la récupération du message:', error);
      throw new Error('Impossible de charger le message pour le moment.');
    }
  });

// Create message
export const createMessage = actionClient
  .inputSchema(messageSchema)
  .action(async ({ parsedInput }) => {
    try {
      const message = await prisma.message.create({
        data: {
          customerName: parsedInput.customerName,
          email: parsedInput.email,
          phone: parsedInput.phone,
          subject: parsedInput.subject,
          message: parsedInput.message,
          type: parsedInput.type,
          priority: parsedInput.priority,
          status: parsedInput.status,
          source: parsedInput.source,
        },
      });

      // Notification en temps réel via Pusher
      try {
        await pusherServer.trigger('admin-messages', 'new-message', {
          message: {
            id: message.id,
            customerName: message.customerName,
            email: message.email,
            subject: message.subject,
            status: message.status,
            createdAt: message.createdAt,
          }
        });
      } catch (pusherError) {
        console.error('Erreur Pusher:', pusherError);
      }

      return { success: true, data: message };
    } catch (error) {
      console.error('Erreur lors de la création du message:', error);
      throw new Error('Impossible de créer le message pour le moment.');
    }
  });

// Update message
export const updateMessage = actionClient
  .inputSchema(messageSchema.extend({
    id: z.string().uuid("Invalid message ID"),
  }))
  .action(async ({ parsedInput: { id, ...data } }) => {
    try {
      const message = await prisma.message.update({
        where: { id },
        data: {
          customerName: data.customerName,
          email: data.email,
          phone: data.phone,
          subject: data.subject,
          message: data.message,
          type: data.type,
          priority: data.priority,
          status: data.status,
          source: data.source,
        },
      });

      // Notification en temps réel via Pusher
      try {
        await pusherServer.trigger('admin-messages', 'message-updated', {
          message: {
            id: message.id,
            customerName: message.customerName,
            email: message.email,
            subject: message.subject,
            status: message.status,
            updatedAt: message.updatedAt,
          }
        });
      } catch (pusherError) {
        console.error('Erreur Pusher:', pusherError);
      }

      return { success: true, data: message };
    } catch (error) {
      console.error('Erreur lors de la mise à jour du message:', error);
      throw new Error('Impossible de mettre à jour le message pour le moment.');
    }
  });

// Delete message
export const deleteMessage = actionClient
  .inputSchema(z.object({
    id: z.string().uuid("Invalid message ID"),
  }))
  .action(async ({ parsedInput: { id } }) => {
    try {
      await prisma.message.delete({
        where: { id },
      });

      // Notification en temps réel via Pusher
      try {
        await pusherServer.trigger('admin-messages', 'message-deleted', {
          messageId: id
        });
      } catch (pusherError) {
        console.error('Erreur Pusher:', pusherError);
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la suppression du message:', error);
      throw new Error('Impossible de supprimer le message pour le moment.');
    }
  });

// Get messages with filters
export const getMessagesWithFilters = actionClient
  .inputSchema(z.object({
    page: z.number().min(1),
    limit: z.number().min(1).max(100),
    search: z.string().optional(),
    status: z.enum(["new", "read", "replied", "closed"]).optional(),
    type: z.string().optional(),
    priority: z.string().optional(),
    date: z.string().optional(),
  }))
  .action(async ({ parsedInput: { page, limit, search, status, type, priority, date } }) => {
    try {
      const skip = (page - 1) * limit;

      // Construire les filtres
      const where: Prisma.MessageWhereInput = {};
      
      if (search) {
        where.OR = [
          { customerName: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { subject: { contains: search, mode: "insensitive" as const } },
          { message: { contains: search, mode: "insensitive" as const } },
        ];
      }
      
      if (status) {
        where.status = status;
      }
      
      if (type) {
        where.type = type;
      }
      
      if (priority) {
        where.priority = priority;
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

      const [messages, total] = await Promise.all([
        prisma.message.findMany({
          where,
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limit,
        }),
        prisma.message.count({ where }),
      ]);

      return {
        success: true,
        data: {
          messages,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des messages filtrés:', error);
      throw new Error('Impossible de charger les messages pour le moment.');
    }
  }); 