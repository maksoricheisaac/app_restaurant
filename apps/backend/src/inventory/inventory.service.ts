import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateIngredientDto,
  CreateStockMovementDto,
  MovementFiltersDto,
  CreateRecipeDto,
  UpdateRecipeDto,
  StockMovementType,
} from './dto/inventory.dto';
import { getSkipTake, toPaginated } from '../common/pagination/paginate';

const NOT_DELETED = { deletedAt: null };

const DEFAULT_LOW_STOCK_THRESHOLD = 10;

export interface LowStockWarning {
  ingredientId: string;
  name: string;
  stock: number;
  minStock: number | null;
}

// Le frontend consomme cette liste comme un tableau complet (sélecteurs de
// recettes/mouvements de stock) : pas de pagination ici pour ne pas casser
// ces écrans. On borne tout de même le résultat pour éviter une requête
// non bornée si la base accumule un très grand nombre d'ingrédients.
const MAX_INGREDIENTS = 1000;

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async findAllIngredients() {
    return this.prisma.ingredient.findMany({
      where: NOT_DELETED,
      include: {
        _count: { select: { recipes: true } },
      },
      orderBy: { name: 'asc' },
      take: MAX_INGREDIENTS,
    });
  }

  async createIngredient(data: CreateIngredientDto) {
    return this.prisma.ingredient.create({
      data: data,
    });
  }

  async updateIngredient(id: string, data: Partial<CreateIngredientDto>) {
    const ingredient = await this.prisma.ingredient.findFirst({
      where: { id, ...NOT_DELETED },
    });
    if (!ingredient) throw new NotFoundException('Ingrédient non trouvé');
    return this.prisma.ingredient.update({ where: { id }, data });
  }

  async removeIngredient(id: string) {
    const ingredient = await this.prisma.ingredient.findFirst({
      where: { id, ...NOT_DELETED },
    });
    if (!ingredient) throw new NotFoundException('Ingrédient non trouvé');
    return this.prisma.ingredient.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async addStockMovement(data: CreateStockMovementDto, userId?: string) {
    const { ingredientId, type, quantity, description, orderId } = data;

    return this.prisma.$transaction(async (tx) => {
      // 1. Créer le mouvement
      const movement = await tx.stockMovement.create({
        data: {
          ingredientId,
          type,
          quantity,
          description,
          userId,
          orderId,
        },
      });

      // 2. Mettre à jour le stock de l'ingrédient
      // IN: +quantity, OUT: -quantity, ADJUST: quantity peut être signé
      const adjustment =
        type === StockMovementType.IN
          ? quantity
          : type === StockMovementType.OUT
            ? -quantity
            : quantity;
      await tx.ingredient.update({
        where: { id: ingredientId },
        data: {
          stock: { increment: adjustment },
        },
      });

      return movement;
    });
  }

  async getDashboard() {
    const where = NOT_DELETED;
    // Requête raw pour comparer stock <= COALESCE(minStock, 10) (colonne-à-colonne)
    const lowStockRaw = this.prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*)::bigint AS count FROM "Ingredient"
      WHERE "deletedAt" IS NULL
        AND "isActive" = true
        AND "stock" <= COALESCE("minStock", 10)
    `
      .then(([r]) => Number(r?.count ?? 0))
      .catch(() => 0);

    const [ingredientsCount, lowStockCount, movementsCount] = await Promise.all(
      [
        this.prisma.ingredient.count({ where }),
        lowStockRaw,
        this.prisma.stockMovement.count({ where: {} }),
      ],
    );

    const recentMovements = await this.prisma.stockMovement.findMany({
      where: {},
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        ingredient: { select: { name: true, unit: true } },
        user: { select: { name: true } },
      },
    });

    return { ingredientsCount, lowStockCount, movementsCount, recentMovements };
  }

  async findMovements(filters: MovementFiltersDto) {
    const { ingredientId, type, dateFrom, dateTo } = filters;

    const where: any = {};
    if (ingredientId) where.ingredientId = ingredientId;
    if (type) where.type = type;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const { skip, take, page, limit } = getSkipTake(
      filters.page,
      filters.limit,
    );

    const [data, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        include: {
          ingredient: { select: { name: true, unit: true } },
          user: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    return toPaginated(data, total, page, limit);
  }

  async getLowStockAlerts(threshold = 10) {
    return this.prisma.ingredient.findMany({
      where: { stock: { lte: threshold }, ...NOT_DELETED },
      orderBy: { stock: 'asc' },
    });
  }

  async findAllRecipes() {
    return this.prisma.recipe.findMany({
      where: { menuItem: NOT_DELETED },
      include: {
        menuItem: { select: { id: true, name: true } },
        ingredient: { select: { id: true, name: true, unit: true } },
      },
    });
  }

  async createRecipe(data: CreateRecipeDto) {
    const menuItem = await this.prisma.menuItem.findFirst({
      where: { id: data.menuItemId, ...NOT_DELETED },
    });
    if (!menuItem) throw new NotFoundException('MenuItem not found');

    return this.prisma.recipe.create({
      data: {
        menuItemId: data.menuItemId,
        ingredientId: data.ingredientId,
        quantity: data.quantity,
      },
      include: {
        menuItem: { select: { id: true, name: true } },
        ingredient: { select: { id: true, name: true, unit: true } },
      },
    });
  }

  async updateRecipe(id: string, data: UpdateRecipeDto) {
    const recipe = await this.prisma.recipe.findFirst({
      where: { id },
    });
    if (!recipe) throw new NotFoundException('Recipe not found');

    return this.prisma.recipe.update({
      where: { id },
      data,
      include: {
        menuItem: { select: { id: true, name: true } },
        ingredient: { select: { id: true, name: true, unit: true } },
      },
    });
  }

  async deleteRecipe(id: string) {
    const recipe = await this.prisma.recipe.findFirst({
      where: { id },
    });
    if (!recipe) throw new NotFoundException('Recipe not found');

    return this.prisma.recipe.delete({ where: { id } });
  }

  // ─── Stock decrement on order creation ───────────────────────────────────

  /**
   * Décrémente atomiquement le stock des ingrédients consommés par une
   * commande, d'après les recettes (Recipe) définies pour chaque article
   * commandé. Appelé par OrdersService/PublicOrderService à l'intérieur de
   * LEUR PROPRE `$transaction` (d'où le paramètre `tx` explicite plutôt que
   * `this.prisma`) pour que la commande et l'impact stock soient atomiques :
   * si le stock est insuffisant, toute la commande est annulée.
   *
   * Les articles sans recette définie (menuItemId null, ou aucun Recipe
   * pour ce menuItem) n'ont simplement aucun impact stock — toutes les
   * cartes ne suivent pas leurs ingrédients au gramme près.
   *
   * Retourne la liste des ingrédients passés sous leur seuil d'alerte après
   * décrément, pour que l'appelant puisse émettre une notification.
   */
  async decrementStockForOrder(
    tx: Prisma.TransactionClient,
    orderId: string,
    items: Array<{ menuItemId?: string | null; quantity: number }>,
  ): Promise<LowStockWarning[]> {
    const menuItemIds = items
      .filter((i) => i.menuItemId)
      .map((i) => i.menuItemId as string);
    if (menuItemIds.length === 0) return [];

    const recipes = await tx.recipe.findMany({
      where: { menuItemId: { in: menuItemIds } },
      select: { menuItemId: true, ingredientId: true, quantity: true },
    });
    if (recipes.length === 0) return [];

    // menuItemId -> quantité commandée (au cas où un même article apparaît
    // plusieurs fois dans `items`, on cumule).
    const orderedQtyByMenuItem = new Map<string, number>();
    for (const item of items) {
      if (!item.menuItemId) continue;
      orderedQtyByMenuItem.set(
        item.menuItemId,
        (orderedQtyByMenuItem.get(item.menuItemId) ?? 0) + item.quantity,
      );
    }

    // ingredientId -> quantité totale à décrémenter
    const neededByIngredient = new Map<string, number>();
    for (const recipe of recipes) {
      const orderedQty = orderedQtyByMenuItem.get(recipe.menuItemId) ?? 0;
      if (orderedQty === 0) continue;
      const needed = recipe.quantity * orderedQty;
      neededByIngredient.set(
        recipe.ingredientId,
        (neededByIngredient.get(recipe.ingredientId) ?? 0) + needed,
      );
    }

    const warnings: LowStockWarning[] = [];

    for (const [ingredientId, needed] of neededByIngredient) {
      // Décrément conditionnel atomique : ne réussit que si le stock actuel
      // couvre le besoin, évitant toute race entre deux commandes
      // concurrentes (Postgres sérialise les UPDATE sur la même ligne).
      const result = await tx.ingredient.updateMany({
        where: { id: ingredientId, stock: { gte: needed } },
        data: { stock: { decrement: needed } },
      });

      if (result.count === 0) {
        const ingredient = await tx.ingredient.findFirst({
          where: { id: ingredientId },
          select: { name: true, stock: true },
        });
        throw new ConflictException(
          ingredient
            ? `Stock insuffisant pour "${ingredient.name}" (disponible : ${ingredient.stock}, requis : ${needed}).`
            : 'Ingrédient introuvable pour le calcul du stock.',
        );
      }

      await tx.stockMovement.create({
        data: {
          ingredientId,
          type: 'OUT',
          quantity: needed,
          description: `Décrémenté automatiquement — commande #${orderId.slice(-6).toUpperCase()}`,
          orderId,
        },
      });

      const updated = await tx.ingredient.findFirst({
        where: { id: ingredientId },
        select: { id: true, name: true, stock: true, minStock: true },
      });
      if (
        updated &&
        updated.stock <= (updated.minStock ?? DEFAULT_LOW_STOCK_THRESHOLD)
      ) {
        warnings.push({
          ingredientId: updated.id,
          name: updated.name,
          stock: updated.stock,
          minStock: updated.minStock,
        });
      }
    }

    return warnings;
  }
}
