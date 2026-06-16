import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateIngredientDto,
  CreateStockMovementDto,
  MovementFiltersDto,
  CreateRecipeDto,
  UpdateRecipeDto,
} from './dto/inventory.dto';
import { getSkipTake, toPaginated } from '../common/pagination/paginate';

const NOT_DELETED = { deletedAt: null };

// Le frontend consomme cette liste comme un tableau complet (sélecteurs de
// recettes/mouvements de stock) : pas de pagination ici pour ne pas casser
// ces écrans. On borne tout de même le résultat pour éviter une requête
// non bornée si un tenant accumule un très grand nombre d'ingrédients.
const MAX_INGREDIENTS = 1000;

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async findAllIngredients(tenantId: string | undefined) {
    if (!tenantId) throw new ForbiddenException('Tenant context required');
    return this.prisma.ingredient.findMany({
      where: { tenantId, ...NOT_DELETED },
      include: {
        _count: { select: { recipes: true } },
      },
      orderBy: { name: 'asc' },
      take: MAX_INGREDIENTS,
    });
  }

  async createIngredient(tenantId: string, data: CreateIngredientDto) {
    return this.prisma.ingredient.create({
      data: { ...data, tenantId },
    });
  }

  async updateIngredient(
    tenantId: string,
    id: string,
    data: Partial<CreateIngredientDto>,
  ) {
    const ingredient = await this.prisma.ingredient.findFirst({
      where: { id, tenantId, ...NOT_DELETED },
    });
    if (!ingredient) throw new NotFoundException('Ingrédient non trouvé');
    // Inclure tenantId dans le where pour garantir l'isolation tenant même en cas de race
    return this.prisma.ingredient.update({ where: { id, tenantId }, data });
  }

  async removeIngredient(tenantId: string, id: string) {
    const ingredient = await this.prisma.ingredient.findFirst({
      where: { id, tenantId, ...NOT_DELETED },
    });
    if (!ingredient) throw new NotFoundException('Ingrédient non trouvé');
    return this.prisma.ingredient.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async addStockMovement(
    tenantId: string,
    data: CreateStockMovementDto,
    userId?: string,
  ) {
    const { ingredientId, type, quantity, description, orderId } = data;

    return this.prisma.$transaction(async (tx) => {
      // 1. Créer le mouvement
      const movement = await tx.stockMovement.create({
        data: {
          tenantId,
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
        type === 'IN' ? quantity : type === 'OUT' ? -quantity : quantity;
      await tx.ingredient.update({
        where: { id: ingredientId, tenantId },
        data: {
          stock: { increment: adjustment },
        },
      });

      return movement;
    });
  }

  async getDashboard(tenantId: string | undefined) {
    if (!tenantId) throw new ForbiddenException('Tenant context required');
    const where = { tenantId, ...NOT_DELETED };
    // Requête raw pour comparer stock <= COALESCE(minStock, 10) (colonne-à-colonne)
    const lowStockRaw = this.prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*)::bigint AS count FROM "Ingredient"
      WHERE "tenantId" = ${tenantId}
        AND "deletedAt" IS NULL
        AND "isActive" = true
        AND "stock" <= COALESCE("minStock", 10)
    `
      .then(([r]) => Number(r?.count ?? 0))
      .catch(() => 0);

    const [ingredientsCount, lowStockCount, movementsCount] = await Promise.all(
      [
        this.prisma.ingredient.count({ where }),
        lowStockRaw,
        this.prisma.stockMovement.count({ where: { tenantId } }),
      ],
    );

    const recentMovements = await this.prisma.stockMovement.findMany({
      where: { tenantId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        ingredient: { select: { name: true, unit: true } },
        user: { select: { name: true } },
      },
    });

    return { ingredientsCount, lowStockCount, movementsCount, recentMovements };
  }

  async findMovements(tenantId: string, filters: MovementFiltersDto) {
    const { ingredientId, type, dateFrom, dateTo } = filters;

    const where: any = { tenantId };
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

  async getLowStockAlerts(tenantId: string, threshold = 10) {
    return this.prisma.ingredient.findMany({
      where: { tenantId, stock: { lte: threshold }, ...NOT_DELETED },
      orderBy: { stock: 'asc' },
    });
  }

  async findAllRecipes(tenantId: string) {
    return this.prisma.recipe.findMany({
      where: { menuItem: { tenantId, ...NOT_DELETED } },
      include: {
        menuItem: { select: { id: true, name: true } },
        ingredient: { select: { id: true, name: true, unit: true } },
      },
    });
  }

  async createRecipe(tenantId: string, data: CreateRecipeDto) {
    const menuItem = await this.prisma.menuItem.findFirst({
      where: { id: data.menuItemId, tenantId, ...NOT_DELETED },
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

  async updateRecipe(tenantId: string, id: string, data: UpdateRecipeDto) {
    const recipe = await this.prisma.recipe.findFirst({
      where: { id, menuItem: { tenantId, ...NOT_DELETED } },
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

  async deleteRecipe(tenantId: string, id: string) {
    const recipe = await this.prisma.recipe.findFirst({
      where: { id, menuItem: { tenantId, ...NOT_DELETED } },
    });
    if (!recipe) throw new NotFoundException('Recipe not found');

    return this.prisma.recipe.delete({ where: { id } });
  }
}
