import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlanLimitService } from '../plans/plans.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

const NOT_DELETED = { deletedAt: null };

@Injectable()
export class MenuService {
  constructor(
    private prisma: PrismaService,
    private planLimitService: PlanLimitService,
  ) {}

  async findAll(
    tenantId: string | undefined,
    query: PaginationQueryDto,
    availableOnly = false,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required');
    const { page = 1, limit = 10, search } = query;
    const take = Math.min(limit, 100);
    const skip = (page - 1) * take;

    const where = {
      tenantId,
      ...NOT_DELETED,
      ...(availableOnly ? { available: true } : {}),
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

    const [data, total] = await Promise.all([
      this.prisma.menuItem.findMany({
        where,
        include: { category: true },
        orderBy: { name: 'asc' },
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

  async update(tenantId: string | undefined, id: string, data: UpdateMenuItemDto) {
    if (!tenantId) throw new ForbiddenException('Tenant context required');
    return this.prisma.menuItem.update({
      where: { id, tenantId },
      data,
    });
  }

  async remove(tenantId: string | undefined, id: string) {
    if (!tenantId) throw new ForbiddenException('Tenant context required');
    return this.prisma.menuItem.update({
      where: { id, tenantId },
      data: { deletedAt: new Date() },
    });
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
          },
        },
      },
      orderBy: { name: 'asc' },
    });
    return categories.filter((cat) => cat.items.length > 0);
  }
}
