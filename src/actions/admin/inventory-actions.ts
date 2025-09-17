"use server";

import { actionClient } from "@/lib/safe-action";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// ===== SCHEMAS DE VALIDATION =====

const ingredientSchema = z.object({
  name: z.string().min(1, "Le nom de l'ingrédient est requis"),
  unit: z.string().min(1, "L'unité est requise"),
  price: z.number().positive("Le prix doit être positif"),
  stock: z.number().min(0, "Le stock ne peut pas être négatif"),
  minStock: z.number().min(0, "Le stock minimum ne peut pas être négatif").optional(),
  supplier: z.string().optional(),
  isActive: z.boolean().default(true),
});

const updateIngredientSchema = ingredientSchema.extend({
  id: z.string().min(1),
});

const recipeSchema = z.object({
  menuItemId: z.string().min(1, "L'élément du menu est requis"),
  ingredientId: z.string().min(1, "L'ingrédient est requis"),
  quantity: z.number().positive("La quantité doit être positive"),
});

const updateRecipeSchema = recipeSchema.extend({
  id: z.string().min(1),
});

const stockMovementSchema = z.object({
  ingredientId: z.string().min(1, "L'ingrédient est requis"),
  type: z.enum(["IN", "OUT", "ADJUST"]),
  quantity: z.number().positive("La quantité doit être positive"),
  description: z.string().optional(),
  userId: z.string().optional(),
  orderId: z.string().optional(),
});

const getIngredientsSchema = z.object({
  search: z.string().optional(),
  page: z.number().min(1).default(1),
  perPage: z.number().min(1).max(100).default(10),
  sortBy: z.enum(['name', 'stock', 'price', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  isActive: z.boolean().optional(),
});

const getStockMovementsSchema = z.object({
  search: z.string().optional(),
  page: z.number().min(1).default(1),
  perPage: z.number().min(1).max(100).default(10),
  type: z.enum(["IN", "OUT", "ADJUST"]).optional(),
  ingredientId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

// ===== ACTIONS POUR LES INGRÉDIENTS =====

export const getAllIngredients = actionClient
  .inputSchema(getIngredientsSchema)
  .action(async ({ parsedInput: { search, page, perPage, sortBy, sortOrder, isActive } }) => {
    try {
      const where = {
        ...(search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { supplier: { contains: search, mode: 'insensitive' as const } }
          ]
        } : {}),
        ...(isActive !== undefined ? { isActive } : {})
      };

      const [ingredients, total] = await Promise.all([
        prisma.ingredient.findMany({
          where,
          orderBy: { [sortBy]: sortOrder },
          skip: (page - 1) * perPage,
          take: perPage,
        }),
        prisma.ingredient.count({ where })
      ]);

      return {
        success: true,
        data: {
          ingredients,
          pagination: {
            total,
            page,
            perPage,
            totalPages: Math.ceil(total / perPage)
          }
        }
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des ingrédients:', error);
      return {
        success: false,
        error: "Erreur lors de la récupération des ingrédients",
        data: {
          ingredients: [],
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

export const createIngredient = actionClient
  .inputSchema(ingredientSchema)
  .action(async ({ parsedInput }) => {
    try {
      // Vérifier si l'ingrédient existe déjà
      const existing = await prisma.ingredient.findFirst({
        where: { name: parsedInput.name }
      });

      if (existing) {
        throw new Error("Un ingrédient avec ce nom existe déjà");
      }

      const ingredient = await prisma.ingredient.create({
        data: parsedInput,
      });

      revalidatePath('/admin/inventory')
      return { success: true, data: ingredient };
    } catch (error) {
      console.error('Erreur lors de la création de l\'ingrédient:', error);
      throw new Error(error instanceof Error ? error.message : "Erreur lors de la création de l'ingrédient");
    }
  });

export const updateIngredient = actionClient
  .inputSchema(updateIngredientSchema)
  .action(async ({ parsedInput: { id, ...data } }) => {
    try {
      const ingredient = await prisma.ingredient.update({
        where: { id },
        data,
      });

      return { success: true, data: ingredient };
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'ingrédient:', error);
      throw new Error("Erreur lors de la mise à jour de l'ingrédient");
    }
  });

export const deleteIngredient = actionClient
  .inputSchema(z.object({ id: z.string().min(1) }))
  .action(async ({ parsedInput: { id } }) => {
    try {
      // Vérifier si l'ingrédient est utilisé dans des recettes
      const recipesCount = await prisma.recipe.count({
        where: { ingredientId: id }
      });

      if (recipesCount > 0) {
        throw new Error("Cet ingrédient est utilisé dans des recettes. Supprimez d'abord les recettes associées.");
      }

      await prisma.ingredient.delete({ where: { id } });
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'ingrédient:', error);
      throw new Error(error instanceof Error ? error.message : "Erreur lors de la suppression de l'ingrédient");
    }
  });

export const toggleIngredientStatus = actionClient
  .inputSchema(z.object({ id: z.string().min(1) }))
  .action(async ({ parsedInput: { id } }) => {
    try {
      const ingredient = await prisma.ingredient.findUnique({ where: { id } });
      if (!ingredient) {
        throw new Error("Ingrédient non trouvé");
      }

      const updatedIngredient = await prisma.ingredient.update({
        where: { id },
        data: { isActive: !ingredient.isActive },
      });

      return { success: true, data: updatedIngredient };
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      throw new Error("Erreur lors du changement de statut");
    }
  });

// ===== ACTIONS POUR LES RECETTES =====

export const getRecipesByMenuItem = actionClient
  .inputSchema(z.object({ menuItemId: z.string().min(1) }))
  .action(async ({ parsedInput: { menuItemId } }) => {
    try {
      const recipes = await prisma.recipe.findMany({
        where: { menuItemId },
        include: {
          ingredient: true,
          menuItem: {
            include: { category: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return { success: true, data: recipes };
    } catch (error) {
      console.error('Erreur lors de la récupération des recettes:', error);
      return { success: false, error: "Erreur lors de la récupération des recettes", data: [] };
    }
  });

export const createRecipe = actionClient
  .inputSchema(recipeSchema)
  .action(async ({ parsedInput }) => {
    try {
      // Vérifier si la recette existe déjà
      const existing = await prisma.recipe.findFirst({
        where: {
          menuItemId: parsedInput.menuItemId,
          ingredientId: parsedInput.ingredientId
        }
      });

      if (existing) {
        throw new Error("Cette recette existe déjà");
      }

      const recipe = await prisma.recipe.create({
        data: parsedInput,
        include: {
          ingredient: true,
          menuItem: {
            include: { category: true }
          }
        }
      });

      return { success: true, data: recipe };
    } catch (error) {
      console.error('Erreur lors de la création de la recette:', error);
      throw new Error(error instanceof Error ? error.message : "Erreur lors de la création de la recette");
    }
  });

export const updateRecipe = actionClient
  .inputSchema(updateRecipeSchema)
  .action(async ({ parsedInput: { id, ...data } }) => {
    try {
      const recipe = await prisma.recipe.update({
        where: { id },
        data,
        include: {
          ingredient: true,
          menuItem: {
            include: { category: true }
          }
        }
      });

      return { success: true, data: recipe };
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la recette:', error);
      throw new Error("Erreur lors de la mise à jour de la recette");
    }
  });

export const deleteRecipe = actionClient
  .inputSchema(z.object({ id: z.string().min(1) }))
  .action(async ({ parsedInput: { id } }) => {
    try {
      await prisma.recipe.delete({ where: { id } });
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la suppression de la recette:', error);
      throw new Error("Erreur lors de la suppression de la recette");
    }
  });

// ===== ACTIONS POUR LES MOUVEMENTS DE STOCK =====

export const getStockMovements = actionClient
  .inputSchema(getStockMovementsSchema)
  .action(async ({ parsedInput: { search, page, perPage, type, ingredientId, dateFrom, dateTo } }) => {
    try {
      const where: any = {};

      if (search) {
        where.OR = [
          { description: { contains: search, mode: 'insensitive' as const } },
          { ingredient: { name: { contains: search, mode: 'insensitive' as const } } }
        ];
      }

      if (type) {
        where.type = type;
      }

      if (ingredientId) {
        where.ingredientId = ingredientId;
      }

      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) {
          where.createdAt.gte = new Date(dateFrom);
        }
        if (dateTo) {
          const endDate = new Date(dateTo);
          endDate.setHours(23, 59, 59, 999);
          where.createdAt.lte = endDate;
        }
      }

      const [movements, total] = await Promise.all([
        prisma.stockMovement.findMany({
          where,
          include: {
            ingredient: true,
            user: true,
            order: {
              include: { user: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * perPage,
          take: perPage,
        }),
        prisma.stockMovement.count({ where })
      ]);

      return {
        success: true,
        data: {
          movements,
          pagination: {
            total,
            page,
            perPage,
            totalPages: Math.ceil(total / perPage)
          }
        }
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des mouvements de stock:', error);
      return {
        success: false,
        error: "Erreur lors de la récupération des mouvements de stock",
        data: {
          movements: [],
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

export const createStockMovement = actionClient
  .inputSchema(stockMovementSchema)
  .action(async ({ parsedInput }) => {
    try {
      // Vérifier que l'ingrédient existe
      const ingredient = await prisma.ingredient.findUnique({
        where: { id: parsedInput.ingredientId }
      });

      if (!ingredient) {
        throw new Error("Ingrédient non trouvé");
      }

      // Calculer le nouveau stock
      let newStock = ingredient.stock;
      if (parsedInput.type === "IN") {
        newStock += parsedInput.quantity;
      } else if (parsedInput.type === "OUT") {
        newStock -= parsedInput.quantity;
        if (newStock < 0) {
          throw new Error("Stock insuffisant. Stock actuel: " + ingredient.stock);
        }
      } else if (parsedInput.type === "ADJUST") {
        newStock = parsedInput.quantity;
      }

      // Utiliser une transaction pour garantir la cohérence
      const result = await prisma.$transaction(async (tx) => {
        // Créer le mouvement de stock
        const movement = await tx.stockMovement.create({
          data: parsedInput,
          include: {
            ingredient: true,
            user: true,
            order: true
          }
        });

        // Mettre à jour le stock de l'ingrédient
        await tx.ingredient.update({
          where: { id: parsedInput.ingredientId },
          data: { stock: newStock }
        });

        return movement;
      });

      revalidatePath('/admin/inventory')  
      return { success: true, data: result };
    } catch (error) {
      console.error('Erreur lors de la création du mouvement de stock:', error);
      throw new Error(error instanceof Error ? error.message : "Erreur lors de la création du mouvement de stock");
    }
  });

// ===== ACTIONS POUR LE DASHBOARD INVENTAIRE =====

export const getInventoryDashboard = actionClient
  .action(async () => {
    try {
      const [
        totalIngredients,
        lowStockIngredients,
        recentMovements,
        totalStockValue
      ] = await Promise.all([
        prisma.ingredient.count(),
        prisma.ingredient.findMany({
          where: {
            isActive: true,
            OR: [
              { minStock: { not: null }, stock: { lte: prisma.ingredient.fields.minStock } },
              { minStock: null, stock: { lte: 0 } }
            ]
          },
          orderBy: { stock: 'asc' }
        }),
        prisma.stockMovement.findMany({
          take: 10,
          include: {
            ingredient: true,
            user: true
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.ingredient.aggregate({
          where: { isActive: true },
          _sum: {
            stock: true
          }
        })
      ]);

      // Calculer la valeur totale du stock
      const ingredients = await prisma.ingredient.findMany({
        where: { isActive: true },
        select: { stock: true, price: true }
      });

      const stockValue = ingredients.reduce((total, ingredient) => {
        return total + (ingredient.stock * ingredient.price);
      }, 0);

      return {
        success: true,
        data: {
          totalIngredients,
          lowStockIngredients,
          recentMovements,
          totalStockValue: stockValue,
          lowStockCount: lowStockIngredients.length
        }
      };
    } catch (error) {
      console.error('Erreur lors de la récupération du dashboard inventaire:', error);
      return {
        success: false,
        error: "Erreur lors de la récupération du dashboard",
        data: {
          totalIngredients: 0,
          lowStockIngredients: [],
          recentMovements: [],
          totalStockValue: 0,
          lowStockCount: 0
        }
      };
    }
  });

// ===== ACTION POUR LA DÉCRÉMENTATION AUTOMATIQUE DES STOCKS =====

export const decrementStockForOrder = actionClient
  .inputSchema(z.object({ orderId: z.string().min(1) }))
  .action(async ({ parsedInput: { orderId } }) => {
    try {
      // Récupérer la commande avec ses articles et leurs recettes
      const order = await prisma.order.findUnique({
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

      if (!order) {
        throw new Error("Commande non trouvée");
      }

      const movements: any[] = [];

      // Utiliser une transaction pour garantir la cohérence
      await prisma.$transaction(async (tx) => {
        for (const orderItem of order.orderItems) {
          for (const recipe of orderItem.menuItem.Recipe) {
            const totalQuantity = recipe.quantity * orderItem.quantity;
            
            // Vérifier le stock disponible
            const ingredient = await tx.ingredient.findUnique({
              where: { id: recipe.ingredientId }
            });

            if (!ingredient) {
              throw new Error(`Ingrédient ${recipe.ingredient.name} non trouvé`);
            }

            if (ingredient.stock < totalQuantity) {
              throw new Error(`Stock insuffisant pour ${ingredient.name}. Stock disponible: ${ingredient.stock}, requis: ${totalQuantity}`);
            }

            // Créer le mouvement de stock
            const movement = await tx.stockMovement.create({
              data: {
                ingredientId: recipe.ingredientId,
                type: "OUT",
                quantity: totalQuantity,
                description: `Sortie automatique pour commande #${order.id} - ${orderItem.name}`,
                orderId: order.id,
                userId: order.userId
              }
            });

            movements.push(movement);

            // Mettre à jour le stock
            await tx.ingredient.update({
              where: { id: recipe.ingredientId },
              data: {
                stock: {
                  decrement: totalQuantity
                }
              }
            });
          }
        }
      });

      return { success: true, data: movements };
    } catch (error) {
      console.error('Erreur lors de la décrementation du stock:', error);
      throw new Error(error instanceof Error ? error.message : "Erreur lors de la décrementation du stock");
    }
  });
