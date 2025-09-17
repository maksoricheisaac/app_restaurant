"use server";

import { actionClient } from "@/lib/safe-action";
import prisma from "@/lib/prisma";
import { z } from "zod";

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  categoryId: string;
  image: string | null;
  category: {
    id: string;
    name: string;
  };
}

export interface Category {
  id: string;
  name: string;
  dishCount: number;
}

const menuFilterSchema = z.object({
  search: z.string().optional().transform(val => val?.trim() || undefined),
  categoryId: z.string().optional().transform(val => val === "all" || val === "" ? undefined : val),
  sortBy: z.enum(['price', 'name']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const getPublicMenu = actionClient
  .inputSchema(menuFilterSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { search, categoryId, sortBy, sortOrder } = parsedInput;

      const where: Record<string, unknown> = {};
      
      if (search && search.trim().length > 0) {
        const searchTerm = search.trim();
        where.OR = [
          { name: { contains: searchTerm } },
          { description: { contains: searchTerm } }
        ];
      }

      
      
      if (categoryId && categoryId !== "all" && categoryId !== "") {
        where.categoryId = categoryId;
      }

      // Fetch items without including the relation to avoid Prisma errors when DB is inconsistent
      const items = await prisma.menuItem.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          categoryId: true,
          image: true
        },
        orderBy: { [sortBy]: sortOrder },
        take: 100
      });

      // Load categories for the returned items in one query
      const categoryIds = Array.from(new Set(items.map(i => i.categoryId).filter(Boolean)));
      const categories = categoryIds.length > 0
        ? await prisma.menuCategory.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true, name: true }
          })
        : [];

      const categoryMap = new Map<string, { id: string; name: string }>(categories.map(c => [c.id, c]));

      // Log any orphaned categoryIds for later DB cleanup
      const missingCategoryIds = categoryIds.filter(id => !categoryMap.has(id));
      if (missingCategoryIds.length > 0) {
        console.warn('Missing categories for categoryIds:', missingCategoryIds);
      }

      // Map results and attach category (fallback to a placeholder if missing)
      const mappedItems = items.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        categoryId: item.categoryId,
        image: item.image,
        category: categoryMap.get(item.categoryId) || { id: item.categoryId, name: 'Unknown' }
      }));

      return {
        success: true, 
        data: {
          items: mappedItems, 
          pagination: {
            total: mappedItems.length,
            page: 1,
            perPage: 100,
            totalPages: 1
          }
        }
      };
    } catch (error) {
      console.error('Erreur lors du chargement du menu:', error);
      return {
        success: false,
        error: 'Impossible de charger le menu pour le moment.',
        data: {
          items: [],
          pagination: {
            total: 0,
            page: 1,
            perPage: 100,
            totalPages: 0
          }
        }
      };
    }
  });

export const getPublicCategories = actionClient
  .action(async () => {
    try {
      const categories = await prisma.menuCategory.findMany({
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          _count: {
            select: { items: true }
          }
        }
      });

      return {
        data: categories.map((cat: { id: string; name: string; _count: { items: number } }) => ({
          id: cat.id,
          name: cat.name,
          dishCount: cat._count.items
        }))
      };
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
      return {
        data: [],
        error: 'Impossible de charger les catégories pour le moment.'
      };
    }
  });

