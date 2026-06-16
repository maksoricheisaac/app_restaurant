import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';

const NOT_DELETED = { deletedAt: null };

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string | undefined) {
    if (!tenantId) throw new ForbiddenException('Tenant context required');
    return this.prisma.menuCategory.findMany({
      where: { tenantId, ...NOT_DELETED },
      include: {
        _count: { select: { items: { where: NOT_DELETED } } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(tenantId: string, data: CreateCategoryDto) {
    return this.prisma.menuCategory.create({
      data: { ...data, tenantId },
    });
  }

  async update(
    tenantId: string | undefined,
    id: string,
    data: CreateCategoryDto,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required');
    return this.prisma.menuCategory.update({
      where: { id, tenantId },
      data,
    });
  }

  async remove(tenantId: string | undefined, id: string) {
    if (!tenantId) throw new ForbiddenException('Tenant context required');
    const now = new Date();
    // Soft delete en transaction : on masque d'abord les items puis la catégorie
    return this.prisma.$transaction([
      this.prisma.menuItem.updateMany({
        where: { categoryId: id, tenantId, deletedAt: null },
        data: { deletedAt: now },
      }),
      this.prisma.menuCategory.update({
        where: { id, tenantId },
        data: { deletedAt: now },
      }),
    ]);
  }
}
