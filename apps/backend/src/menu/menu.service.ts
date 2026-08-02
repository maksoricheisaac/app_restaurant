import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlanLimitService } from '../plans/plans.service';
import { BlobService } from '../blob/blob.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

const NOT_DELETED = { deletedAt: null };

@Injectable()
export class MenuService {
  constructor(
    private prisma: PrismaService,
    private planLimitService: PlanLimitService,
    private blobService: BlobService,
  ) {}

  async findAll(
    tenantId: string | undefined,
    query: PaginationQueryDto,
    availableOnly = false,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required');
    const {
      page = 1,
      limit = 10,
      search,
      sort = 'name',
      order = 'asc',
      categoryId,
    } = query;
    const take = Math.min(limit, 100);
    const skip = (page - 1) * take;

    const where: any = {
      tenantId,
      ...NOT_DELETED,
      ...(availableOnly || query.availableOnly === 'true'
        ? { available: true }
        : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              {
                description: { contains: search, mode: 'insensitive' as const },
              },
            ],
          }
        : {}),
    };

    const orderBy: any =
      sort === 'category'
        ? { category: { name: order as 'asc' | 'desc' } }
        : { [sort]: order as 'asc' | 'desc' };

    const [data, total] = await Promise.all([
      this.prisma.menuItem.findMany({
        where,
        include: { category: true },
        orderBy,
        skip,
        take,
      }),
      this.prisma.menuItem.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit: take,
        total,
        pages: Math.ceil(total / take),
      },
    };
  }

  async findOne(tenantId: string | undefined, id: string) {
    if (!tenantId) throw new ForbiddenException('Tenant context required');
    return this.prisma.menuItem.findFirst({
      where: { id, tenantId, ...NOT_DELETED },
      include: { category: true, recipes: { include: { ingredient: true } } },
    });
  }

  async create(tenantId: string, data: CreateMenuItemDto) {
    await this.planLimitService.assertMenuItemLimit(tenantId);
    return this.prisma.menuItem.create({
      data: { ...data, tenantId },
    });
  }

  async update(
    tenantId: string | undefined,
    id: string,
    data: UpdateMenuItemDto,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required');
    return this.prisma.menuItem.update({
      where: { id, tenantId },
      data,
    });
  }

  async remove(tenantId: string | undefined, id: string) {
    if (!tenantId) throw new ForbiddenException('Tenant context required');

    const item = await this.prisma.menuItem.findFirst({
      where: { id, tenantId, ...NOT_DELETED },
      select: { imagePathname: true },
    });

    const result = await this.prisma.menuItem.update({
      where: { id, tenantId },
      data: { deletedAt: new Date() },
    });

    // Best-effort blob cleanup — does not block the soft-delete
    if (item?.imagePathname) {
      await this.blobService.deleteImage(item.imagePathname);
    }

    return result;
  }

  async findPublicMenu(tenantId: string) {
    const categories = await this.prisma.menuCategory.findMany({
      where: { tenantId, ...NOT_DELETED },
      include: {
        items: {
          where: { available: true, ...NOT_DELETED },
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            image: true,
            optionGroups: {
              where: { ...NOT_DELETED },
              orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
              select: {
                id: true,
                name: true,
                required: true,
                minSelect: true,
                maxSelect: true,
                options: {
                  where: { available: true, ...NOT_DELETED },
                  orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
                  select: { id: true, name: true, priceDelta: true },
                },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
    // On ne renvoie que les groupes qui ont au moins une option disponible.
    return categories
      .filter((cat) => cat.items.length > 0)
      .map((cat) => ({
        ...cat,
        items: cat.items.map((item) => ({
          ...item,
          optionGroups: item.optionGroups.filter((g) => g.options.length > 0),
        })),
      }));
  }
}
