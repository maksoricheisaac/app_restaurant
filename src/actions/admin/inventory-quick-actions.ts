"use server";

import { actionClient } from "@/lib/safe-action";
import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { pusherServer } from "@/lib/pusher";

// ===== ACTIONS RAPIDES POUR L'INVENTAIRE =====

// Action rapide: Ajouter du stock (Entrée)
export const quickAddStock = actionClient
  .inputSchema(z.object({
    ingredientId: z.string().min(1),
    quantity: z.number().positive("La quantité doit être positive"),
    isPack: z.boolean().default(false), // true si on ajoute des packs
    description: z.string().optional(),
  }))
  .action(async ({ parsedInput }) => {
    try {
      const ingredient = await prisma.ingredient.findUnique({
        where: { id: parsedInput.ingredientId }
      });

      if (!ingredient) {
        throw new Error("Produit non trouvé");
      }

      // Calculer la quantité réelle en unités
      let quantityInUnits = parsedInput.quantity;
      if (parsedInput.isPack && ingredient.packSize) {
        quantityInUnits = parsedInput.quantity * ingredient.packSize;
      }

      // Transaction pour garantir la cohérence
      const result = await prisma.$transaction(async (tx) => {
        // Créer le mouvement
        const movement = await tx.stockMovement.create({
          data: {
            ingredientId: parsedInput.ingredientId,
            type: "IN",
            quantity: quantityInUnits,
            description: parsedInput.description || `Entrée rapide: ${parsedInput.isPack ? `${parsedInput.quantity} pack(s)` : `${parsedInput.quantity} unité(s)`}`,
          }
        });

        // Mettre à jour le stock
        const updatedIngredient = await tx.ingredient.update({
          where: { id: parsedInput.ingredientId },
          data: {
            stock: {
              increment: quantityInUnits
            }
          }
        });

        return { movement, ingredient: updatedIngredient };
      });

      // Notification Pusher en temps réel
      await pusherServer.trigger('restaurant-channel', 'stock-updated', {
        ingredientId: ingredient.id,
        name: ingredient.name,
        newStock: result.ingredient.stock,
        type: 'IN',
        quantity: quantityInUnits
      });

      revalidatePath('/admin/inventory');
      return { 
        success: true, 
        data: result,
        message: `✅ +${quantityInUnits} ${ingredient.unit} ajouté(s) au stock`
      };
    } catch (error) {
      console.error('Erreur lors de l\'ajout rapide de stock:', error);
      throw new Error(error instanceof Error ? error.message : "Erreur lors de l'ajout de stock");
    }
  });

// Action rapide: Retirer du stock (Sortie)
export const quickRemoveStock = actionClient
  .inputSchema(z.object({
    ingredientId: z.string().min(1),
    quantity: z.number().positive("La quantité doit être positive"),
    isPack: z.boolean().default(false),
    description: z.string().optional(),
  }))
  .action(async ({ parsedInput }) => {
    try {
      const ingredient = await prisma.ingredient.findUnique({
        where: { id: parsedInput.ingredientId }
      });

      if (!ingredient) {
        throw new Error("Produit non trouvé");
      }

      // Calculer la quantité réelle en unités
      let quantityInUnits = parsedInput.quantity;
      if (parsedInput.isPack && ingredient.packSize) {
        quantityInUnits = parsedInput.quantity * ingredient.packSize;
      }

      // Vérifier le stock disponible
      if (ingredient.stock < quantityInUnits) {
        throw new Error(`Stock insuffisant. Disponible: ${ingredient.stock} ${ingredient.unit}`);
      }

      // Transaction
      const result = await prisma.$transaction(async (tx) => {
        const movement = await tx.stockMovement.create({
          data: {
            ingredientId: parsedInput.ingredientId,
            type: "OUT",
            quantity: quantityInUnits,
            description: parsedInput.description || `Sortie rapide: ${parsedInput.isPack ? `${parsedInput.quantity} pack(s)` : `${parsedInput.quantity} unité(s)`}`,
          }
        });

        const updatedIngredient = await tx.ingredient.update({
          where: { id: parsedInput.ingredientId },
          data: {
            stock: {
              decrement: quantityInUnits
            }
          }
        });

        return { movement, ingredient: updatedIngredient };
      });

      // Notification Pusher
      await pusherServer.trigger('restaurant-channel', 'stock-updated', {
        ingredientId: ingredient.id,
        name: ingredient.name,
        newStock: result.ingredient.stock,
        type: 'OUT',
        quantity: quantityInUnits
      });

      revalidatePath('/admin/inventory');
      return { 
        success: true, 
        data: result,
        message: `✅ -${quantityInUnits} ${ingredient.unit} retiré(s) du stock`
      };
    } catch (error) {
      console.error('Erreur lors du retrait rapide de stock:', error);
      throw new Error(error instanceof Error ? error.message : "Erreur lors du retrait de stock");
    }
  });

// Action rapide: Ajuster le stock (Correction)
export const quickAdjustStock = actionClient
  .inputSchema(z.object({
    ingredientId: z.string().min(1),
    newStock: z.number().min(0, "Le stock ne peut pas être négatif"),
    description: z.string().optional(),
  }))
  .action(async ({ parsedInput }) => {
    try {
      const ingredient = await prisma.ingredient.findUnique({
        where: { id: parsedInput.ingredientId }
      });

      if (!ingredient) {
        throw new Error("Produit non trouvé");
      }

      const oldStock = ingredient.stock;
      const difference = parsedInput.newStock - oldStock;

      // Transaction
      const result = await prisma.$transaction(async (tx) => {
        const movement = await tx.stockMovement.create({
          data: {
            ingredientId: parsedInput.ingredientId,
            type: "ADJUST",
            quantity: parsedInput.newStock,
            description: parsedInput.description || `Ajustement: ${oldStock} → ${parsedInput.newStock} (${difference > 0 ? '+' : ''}${difference})`,
          }
        });

        const updatedIngredient = await tx.ingredient.update({
          where: { id: parsedInput.ingredientId },
          data: {
            stock: parsedInput.newStock
          }
        });

        return { movement, ingredient: updatedIngredient };
      });

      // Notification Pusher
      await pusherServer.trigger('restaurant-channel', 'stock-updated', {
        ingredientId: ingredient.id,
        name: ingredient.name,
        newStock: result.ingredient.stock,
        type: 'ADJUST',
        oldStock,
        difference
      });

      revalidatePath('/admin/inventory');
      return { 
        success: true, 
        data: result,
        message: `✅ Stock ajusté: ${parsedInput.newStock} ${ingredient.unit}`
      };
    } catch (error) {
      console.error('Erreur lors de l\'ajustement rapide de stock:', error);
      throw new Error(error instanceof Error ? error.message : "Erreur lors de l'ajustement de stock");
    }
  });

// Récupérer tous les produits avec filtrage simplifié
export const getInventoryProducts = actionClient
  .inputSchema(z.object({
    search: z.string().optional(),
    category: z.string().optional(),
    stockStatus: z.enum(['all', 'low', 'out']).default('all'),
  }))
  .action(async ({ parsedInput }) => {
    try {
      const where: Prisma.IngredientWhereInput = {
        isActive: true,
      };

      if (parsedInput.search) {
        where.OR = [
          { name: { contains: parsedInput.search, mode: 'insensitive' } },
          { supplier: { contains: parsedInput.search, mode: 'insensitive' } }
        ];
      }

      if (parsedInput.category) {
        where.category = parsedInput.category;
      }

      // Filtrage par statut de stock
      if (parsedInput.stockStatus === 'low') {
        where.AND = [
          { minStock: { not: null } },
          { stock: { lte: prisma.ingredient.fields.minStock } }
        ];
      } else if (parsedInput.stockStatus === 'out') {
        where.stock = { lte: 0 };
      }

      const products = await prisma.ingredient.findMany({
        where,
        orderBy: [
          { stock: 'asc' }, // Produits en rupture/faible stock en premier
          { name: 'asc' }
        ],
      });

      // Calculer les statistiques
      const stats = {
        total: products.length,
        lowStock: products.filter(p => p.minStock && p.stock <= p.minStock).length,
        outOfStock: products.filter(p => p.stock <= 0).length,
        totalValue: products.reduce((sum, p) => sum + (p.stock * p.price), 0),
      };

      return {
        success: true,
        data: {
          products,
          stats
        }
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des produits:', error);
      return {
        success: false,
        error: "Erreur lors de la récupération des produits",
        data: { products: [], stats: { total: 0, lowStock: 0, outOfStock: 0, totalValue: 0 } }
      };
    }
  });

// Créer un nouveau produit simplifié
export const createProduct = actionClient
  .inputSchema(z.object({
    name: z.string().min(1, "Le nom est requis"),
    unit: z.string().min(1, "L'unité est requise"),
    price: z.number().positive("Le prix doit être positif"),
    stock: z.number().min(0, "Le stock ne peut pas être négatif").default(0),
    minStock: z.number().min(0).optional(),
    supplier: z.string().optional(),
    category: z.string().optional(),
    packSize: z.number().int().positive().optional(),
  }))
  .action(async ({ parsedInput }) => {
    try {
      const existing = await prisma.ingredient.findFirst({
        where: { name: parsedInput.name }
      });

      if (existing) {
        throw new Error("Un produit avec ce nom existe déjà");
      }

      const product = await prisma.ingredient.create({
        data: {
          ...parsedInput,
          isActive: true,
        },
      });

      revalidatePath('/admin/inventory');
      return { 
        success: true, 
        data: product,
        message: `✅ Produit "${product.name}" créé avec succès`
      };
    } catch (error) {
      console.error('Erreur lors de la création du produit:', error);
      throw new Error(error instanceof Error ? error.message : "Erreur lors de la création du produit");
    }
  });

// Mettre à jour un produit
export const updateProduct = actionClient
  .inputSchema(z.object({
    id: z.string().min(1),
    name: z.string().min(1).optional(),
    unit: z.string().min(1).optional(),
    price: z.number().positive().optional(),
    minStock: z.number().min(0).optional(),
    supplier: z.string().optional(),
    category: z.string().optional(),
    packSize: z.number().int().positive().optional(),
  }))
  .action(async ({ parsedInput: { id, ...data } }) => {
    try {
      const product = await prisma.ingredient.update({
        where: { id },
        data,
      });

      revalidatePath('/admin/inventory');
      return { 
        success: true, 
        data: product,
        message: `✅ Produit mis à jour`
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour du produit:', error);
      throw new Error("Erreur lors de la mise à jour du produit");
    }
  });
