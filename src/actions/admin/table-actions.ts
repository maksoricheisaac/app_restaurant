"use server";

import { actionClient } from "@/lib/safe-action";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { pusherServer } from "@/lib/pusher";


// Schema for table validation
const tableSchema = z.object({
  number: z.number().int().positive("Le numéro de table doit être positif"),
  seats: z.number().int().positive("Le nombre de places doit être positif"),
  status: z.enum(["available", "occupied", "reserved"]).default("available"),
  location: z.string().optional(),
});

// Get all tables with filters
export const getTables = actionClient
  .inputSchema(z.object({
    search: z.string().optional(),
    isAvailable: z.boolean().optional(),
    minCapacity: z.number().optional(),
    maxCapacity: z.number().optional(),
    location: z.string().optional(),
    sort: z.enum(["number", "seats", "location"]).optional(),
    order: z.enum(["asc", "desc"]).optional(),
  }))
  .action(async ({ parsedInput }) => {
    try {
      const {
        search,
        isAvailable,
        minCapacity,
        maxCapacity,
        location,
        sort = "number",
        order = "asc",
      } = parsedInput;

      // Build Prisma filters
      const where: Record<string, unknown> = {};
      if (search) {
        where.OR = [
          { number: { equals: Number(search) } },
          { location: { contains: search, mode: "insensitive" } },
        ];
      }
      if (typeof isAvailable === "boolean") {
        where.status = isAvailable ? "available" : { not: "available" };
      }
      if (minCapacity) {
        where.seats = { ...(where.seats || {}), gte: minCapacity };
      }
      if (maxCapacity) {
        where.seats = { ...(where.seats || {}), lte: maxCapacity };
      }
      if (location) {
        where.location = location;
      }

      // Build orderBy
      let orderBy: Record<string, "asc" | "desc"> = { number: order };
      if (sort === "seats") {
        orderBy = { seats: order };
      } else if (sort === "location") {
        orderBy = { location: order };
      }

      const tables = await prisma.table.findMany({
        where,
        include: {
          _count: {
            select: {
              orders: true,
              reservations: true,
            },
          },
        },
        orderBy,
      });

      return { success: true, data: tables };
    } catch (error) {
      console.error('Erreur lors de la récupération des tables:', error);
      throw new Error('Impossible de charger les tables pour le moment.');
    }
  });

// Get table by ID
export const getTableById = actionClient
  .schema(z.object({
    id: z.string().uuid("Invalid table ID"),
  }))
  .action(async ({ parsedInput: { id } }) => {
    try {
      const table = await prisma.table.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              orders: true,
              reservations: true,
            },
          },
        },
      });
      
      if (!table) {
        throw new Error('Table non trouvée');
      }
      
      return { success: true, data: table };
    } catch (error) {
      console.error('Erreur lors de la récupération de la table:', error);
      throw new Error('Impossible de charger la table pour le moment.');
    }
  });

// Create table
export const createTable = actionClient
  .schema(tableSchema)
  .action(async ({ parsedInput }) => {
    try {
      const table = await prisma.table.create({
        data: {
          number: parsedInput.number,
          seats: parsedInput.seats,
          status: parsedInput.status,
          location: parsedInput.location,
        },
        include: {
          _count: {
            select: {
              orders: true,
              reservations: true,
            },
          },
        },
      });

      // Notification en temps réel via Pusher
      try {
        await pusherServer.trigger('admin-tables', 'new-table', {
          table: {
            id: table.id,
            number: table.number,
            seats: table.seats,
            status: table.status,
            location: table.location,
          }
        });
      } catch (pusherError) {
        console.error('Erreur Pusher:', pusherError);
      }

      return { success: true, data: table };
    } catch (error) {
      console.error('Erreur lors de la création de la table:', error);
      throw new Error('Impossible de créer la table pour le moment.');
    }
  });

// Update table
export const updateTable = actionClient
  .inputSchema(tableSchema.extend({
    id: z.string().uuid("Invalid table ID"),
  }))
  .action(async ({ parsedInput: { id, ...data } }) => {
    try {
      const table = await prisma.table.update({
        where: { id },
        data: {
          number: data.number,
          seats: data.seats,
          status: data.status,
          location: data.location,
        },
        include: {
          _count: {
            select: {
              orders: true,
              reservations: true,
            },
          },
        },
      });

      // Notification en temps réel via Pusher
      try {
        await pusherServer.trigger('admin-tables', 'table-updated', {
          table: {
            id: table.id,
            number: table.number,
            seats: table.seats,
            status: table.status,
          }
        });
      } catch (pusherError) {
        console.error('Erreur Pusher:', pusherError);
      }

      return { success: true, data: table };
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la table:', error);
      throw new Error('Impossible de mettre à jour la table pour le moment.');
    }
  });

// Delete table
export const deleteTable = actionClient
  .schema(z.object({
    id: z.string().uuid("Invalid table ID"),
  }))
  .action(async ({ parsedInput: { id } }) => {
    try {
      await prisma.table.delete({
        where: { id },
      });

      // Notification en temps réel via Pusher
      try {
        await pusherServer.trigger('admin-tables', 'table-deleted', {
          tableId: id
        });
      } catch (pusherError) {
        console.error('Erreur Pusher:', pusherError);
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la suppression de la table:', error);
      throw new Error('Impossible de supprimer la table pour le moment.');
    }
  });

// Get available tables
export const getAvailableTables = actionClient
  .schema(z.void())
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

// Get table locations (ajouté pour corriger l'import dans page.tsx)
export const getTableLocations = actionClient
  .schema(z.void())
  .action(async () => {
    try {
      const locations = await prisma.table.findMany({
        select: { location: true },
        distinct: ['location'],
        where: { location: { not: null } },
        orderBy: { location: 'asc' },
      });
      return { success: true, data: locations.map(l => l.location).filter(Boolean) };
    } catch (error) {
      console.error("Erreur lors de la récupération des localisations:", error);
      throw new Error("Impossible de récupérer la liste des localisations.");
    }
  });