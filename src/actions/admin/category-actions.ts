"use server";

import { z } from "zod";  
import { actionClient } from "@/lib/safe-action";
import prisma from "@/lib/prisma";

const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

const categoryIdSchema = z.object({
  id: z.string().uuid("Invalid category ID"),
});

const updateCategorySchema = categorySchema.extend({
  id: z.string().uuid("Invalid category ID"),
});

const getCategoriesSchema = z.object({
  search: z.string().optional(),
  page: z.number().min(1).default(1),
  perPage: z.number().min(1).max(100).default(10),
  sortBy: z.enum(['name', 'items']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const createCategory = actionClient
  .inputSchema(categorySchema)
  .action(async ({ parsedInput: { name } }) => {
    try {
      const category = await prisma.menuCategory.create({
        data: { name },
      });
      return { success: true, data: category };
      
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes("P2002")) {
        throw new Error("Cette catégorie existe déjà");
      }
      throw new Error("Erreur lors de la création de la catégorie");
    }
  });

export const updateCategory = actionClient
  .inputSchema(updateCategorySchema)
  .action(async ({ parsedInput: { id, name } }) => {
    try {
      console.log(id)
      const category = await prisma.menuCategory.update({
        where: { id },
        data: { name },
      });
      return { success: true, data: category };
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message.includes("P2002")) {
          throw new Error("Une catégorie avec ce nom existe déjà");
        }
        if (error.message.includes("P2025")) {
          throw new Error("Catégorie non trouvée");
        }
      }
      throw new Error("Erreur lors de la mise à jour de la catégorie");
    }
  });

export const deleteCategory = actionClient
  .inputSchema(categoryIdSchema)
  .action(async ({ parsedInput: { id } }) => {
    try {
      console.log(id)
      await prisma.menuCategory.delete({
        where: { id },
      });
      return { success: true };
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes("P2025")) {
        throw new Error("Catégorie non trouvée");
      }
      throw new Error("Erreur lors de la suppression de la catégorie");
    }
  });

export const getCategories = actionClient
  .inputSchema(getCategoriesSchema)
  .action(async ({ parsedInput: { search, page, perPage, sortBy, sortOrder } }) => {
    try {
      const where = search
        ? {
            name: {
              contains: search,
              mode: "insensitive" as const,
            },
          }
        : {};

      // Gestion spéciale pour le tri par nombre d'items
      const orderBy = sortBy === 'items' 
        ? { _count: { items: sortOrder } }
        : { [sortBy]: sortOrder };

      const [categories, total] = await Promise.all([
        prisma.menuCategory.findMany({
          where,
          orderBy,
          include: {
            _count: {
              select: { items: true },
            },
          },
          skip: (page - 1) * perPage,
          take: perPage,
        }),
        prisma.menuCategory.count({ where })
      ]);

      return { 
        success: true, 
        data: {
          categories,
          pagination: {
            total,
            page,
            perPage,
            totalPages: Math.ceil(total / perPage)
          }
        }
      };
    } catch {
      throw new Error("Erreur lors de la récupération des catégories");
    }
  }); 