import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlobService } from '../blob/blob.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

const NOT_DELETED = { deletedAt: null };

@Injectable()
export class MenuService {
  constructor(
    private prisma: PrismaService,
    private blobService: BlobService,
  ) {}

  async findAll(query: PaginationQueryDto, availableOnly = false) {
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

  async findOne(id: string) {
    return this.prisma.menuItem.findFirst({
      where: { id, ...NOT_DELETED },
      include: { category: true, recipes: { include: { ingredient: true } } },
    });
  }

  async create(data: CreateMenuItemDto) {
    return this.prisma.menuItem.create({ data });
  }

  async update(id: string, data: UpdateMenuItemDto) {
    return this.prisma.menuItem.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    const item = await this.prisma.menuItem.findFirst({
      where: { id, ...NOT_DELETED },
      select: { imagePathname: true },
    });

    const result = await this.prisma.menuItem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Best-effort blob cleanup — does not block the soft-delete
    if (item?.imagePathname) {
      await this.blobService.deleteImage(item.imagePathname);
    }

    return result;
  }

  /**
   * Catalogue destiné au poste de caisse : toute la carte vendable, à plat,
   * avec ses groupes d'options.
   *
   * Ne passe pas par `findAll` à dessein. Celui-ci est paginé (10 articles
   * par défaut) : un serveur n'y voyait qu'une fraction de la carte. Et les
   * groupes d'options n'ont de sens que sur ce chemin — les charger sur la
   * liste d'administration alourdirait chaque page pour rien.
   *
   * Contrairement à la carte publique, les articles marqués indisponibles
   * sont renvoyés — l'employé peut les vendre s'il sait qu'il en reste —
   * mais avec leur drapeau `available`, pour que l'écran les signale.
   */
  async findPosCatalogue() {
    const items = await this.prisma.menuItem.findMany({
      where: NOT_DELETED,
      orderBy: { name: 'asc' },
      take: 500,
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        image: true,
        available: true,
        categoryId: true,
        optionGroups: {
          where: NOT_DELETED,
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
    });

    // Un groupe dont toutes les options sont indisponibles n'a rien à
    // proposer : on ne l'affiche pas plutôt que de montrer une liste vide.
    return items.map((item) => ({
      ...item,
      optionGroups: item.optionGroups.filter((g) => g.options.length > 0),
    }));
  }

  async findPublicMenu() {
    const categories = await this.prisma.menuCategory.findMany({
      where: NOT_DELETED,
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
