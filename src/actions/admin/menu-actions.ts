"use server";
import { actionClient } from "@/lib/safe-action";
import prisma from "@/lib/prisma";
import { z } from "zod";

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
  const item = await prisma.menuItem.create({
    data: parsedInput,
    include: { category: true },
  });
  return { item };
});

export const updateMenuItem = actionClient.inputSchema(updateMenuItemSchema).action(async ({ parsedInput }) => {
  const { id, ...data } = parsedInput;
  const item = await prisma.menuItem.update({
    where: { id },
    data,
    include: { category: true },
  });
  return { item };
});

export const deleteMenuItem = actionClient.inputSchema(z.object({ id: z.string().min(1) })).action(async ({ parsedInput }) => {
  await prisma.menuItem.delete({ where: { id: parsedInput.id } });
  return { success: true };
});

export const getCategories = actionClient.action(async () => {
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

export const createCategory = actionClient.inputSchema(z.object({ name: z.string().min(1) })).action(async ({ parsedInput }) => {
  const existing = await prisma.menuCategory.findFirst({ where: { name: parsedInput.name } });
  if (existing) throw new Error("Cette catégorie existe déjà.");
  const category = await prisma.menuCategory.create({ data: { name: parsedInput.name } });
  return { category };
});

export const updateCategory = actionClient.inputSchema(z.object({ id: z.string().min(1), name: z.string().min(1) })).action(async ({ parsedInput }) => {
  const { id, name } = parsedInput;
  const category = await prisma.menuCategory.update({ where: { id }, data: { name } });
  return { category };
});

export const deleteCategory = actionClient.inputSchema(z.object({ id: z.string().min(1) })).action(async ({ parsedInput }) => {
  await prisma.menuCategory.delete({ where: { id: parsedInput.id } });
  return { success: true };
}); 

export const createMenuCategory = actionClient
  .inputSchema(z.object({
    name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  }))
  .action(async ({ parsedInput }) => {
    try {
      // Vérifier si la catégorie existe déjà
      const existing = await prisma.menuCategory.findFirst({ 
        where: { name: parsedInput.name } 
      });

      if (existing) {
        throw new Error("Une catégorie avec ce nom existe déjà");
      }

      const category = await prisma.menuCategory.create({
        data: {
          name: parsedInput.name,
        },
      });

      return { success: true, data: category };
    } catch (error) {
      console.error('Erreur lors de la création de la catégorie:', error);
      throw new Error('Impossible de créer la catégorie pour le moment.');
    }
  }); 