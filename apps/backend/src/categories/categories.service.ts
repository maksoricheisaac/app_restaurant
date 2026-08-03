import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';

const NOT_DELETED = { deletedAt: null };

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.menuCategory.findMany({
      where: NOT_DELETED,
      include: {
        _count: { select: { items: { where: NOT_DELETED } } },
      },
      orderBy: { name: 'asc' },
    });
  }

  create(data: CreateCategoryDto) {
    return this.prisma.menuCategory.create({ data });
  }

  update(id: string, data: CreateCategoryDto) {
    return this.prisma.menuCategory.update({ where: { id }, data });
  }

  remove(id: string) {
    const now = new Date();
    // Soft delete en transaction : on masque d'abord les plats, puis la catégorie
    return this.prisma.$transaction([
      this.prisma.menuItem.updateMany({
        where: { categoryId: id, deletedAt: null },
        data: { deletedAt: now },
      }),
      this.prisma.menuCategory.update({
        where: { id },
        data: { deletedAt: now },
      }),
    ]);
  }
}
