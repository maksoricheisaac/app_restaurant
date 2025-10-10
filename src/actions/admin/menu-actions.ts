"use server";
import { actionClient } from "@/lib/safe-action";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { requireStaff, requireRole } from "@/lib/auth-helpers";

const menuItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  price: z.number().int().min(0),
  categoryId: z.string().min(1),
  image: z.string().optional().nullable(),
  spicy: z.boolean().optional(),
  popular: z.boolean().optional(),
  vegetarian: z.boolean().optional(),
  available: z.boolean().optional(),
  prepTime: z.string().optional(),
  ingredients: z.array(z.string()).optional(),
  allergens: z.array(z.string()).optional(),
  calories: z.number().int().optional(),
});

const updateMenuItemSchema = menuItemSchema.extend({
  id: z.string().min(1),
});

const getMenuItemsSchema = z.object({
  search: z.string().optional(),
  page: z.number().min(1).default(1),
  perPage: z.number().min(1).max(100).default(10),
  categoryId: z.string().optional(),
  sortBy: z.enum(['name', 'price', 'category', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const getAllMenuItems = actionClient
  .inputSchema(getMenuItemsSchema)
  .action(async ({ parsedInput: { search, page, perPage, categoryId, sortBy, sortOrder } }) => {
    try {
      await requireStaff();
      const where = {
        ...(search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } }
          ]
        } : {}),
        ...((categoryId && categoryId !== "all") ? { categoryId } : {})
      };

      // Gestion spéciale pour le tri par catégorie
      const orderBy = sortBy === "category" 
        ? { category: { name: sortOrder } }
        : { [sortBy]: sortOrder };

      const [items, total] = await Promise.all([
        prisma.menuItem.findMany({
          where,
          include: { category: true },
          orderBy,
          skip: (page - 1) * perPage,
          take: perPage,
        }),
        prisma.menuItem.count({ where })
      ]);

      return {
        success: true,
        data: {
          items,
          pagination: {
            total,
            page,
            perPage,
            totalPages: Math.ceil(total / perPage)
          }
        }
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des éléments du menu:', error);
      return {
        success: false,
        error: "Erreur lors de la récupération des éléments du menu",
        data: {
          items: [],
          pagination: {
            total: 0,
            page: 1,
            perPage: 10,
            totalPages: 0
          }
        }
      };
    }
  });

export const createMenuItem = actionClient.inputSchema(menuItemSchema).action(async ({ parsedInput }) => {
  await requireRole(['admin', 'owner', 'manager', 'head_chef']);
  const item = await prisma.menuItem.create({
    data: parsedInput,
    include: { category: true },
  });
  return { item };
});

export const updateMenuItem = actionClient.inputSchema(updateMenuItemSchema).action(async ({ parsedInput }) => {
  await requireRole(['admin', 'owner', 'manager', 'head_chef']);
  const { id, ...data } = parsedInput;
  const item = await prisma.menuItem.update({
    where: { id },
    data,
    include: { category: true },
  });
  return { item };
});

export const deleteMenuItem = actionClient.inputSchema(z.object({ id: z.string().min(1) })).action(async ({ parsedInput }) => {
  await requireRole(['admin', 'owner', 'head_chef']);
  await prisma.menuItem.delete({ where: { id: parsedInput.id } });
  return { success: true };
});

export const getCategories = actionClient.action(async () => {
  await requireStaff();
  const categories = await prisma.menuCategory.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { items: true }
      }
    }
  });
  
  // Transform the response to include the count directly
  const categoriesWithCount = categories.map(cat => ({
    id: cat.id,
    name: cat.name,
    dishCount: cat._count.items
  }));
  
  return { categories: categoriesWithCount };
});


