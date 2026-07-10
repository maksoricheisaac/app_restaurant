import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { getSkipTake, toPaginated } from '../common/pagination/paginate';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async create(createTenantDto: CreateTenantDto) {
    try {
      return await this.prisma.tenant.create({
        data: {
          name: createTenantDto.name,
          slug: createTenantDto.slug,
          plan: (createTenantDto.plan || 'free') as any,
          status: 'active' as any,
        },
      });
    } catch {
      throw new InternalServerErrorException(
        'Erreur lors de la création du tenant',
      );
    }
  }

  async findAll(includeDeleted = false, page?: number, limit?: number) {
    const where = includeDeleted ? {} : { deletedAt: null };
    const { skip, take, page: p, limit: l } = getSkipTake(page, limit);

    const [data, total] = await Promise.all([
      this.prisma.tenant.findMany({ where, skip, take }),
      this.prisma.tenant.count({ where }),
    ]);

    return toPaginated(data, total, p, l);
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                platformRole: true,
                status: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });
    if (!tenant) return null;
    // Vue admin : on ne filtre pas les tenants soft-deleted (utile pour
    // l'outillage support), mais on signale explicitement leur état plutôt
    // que de laisser l'appelant le déduire silencieusement de deletedAt.
    return { ...tenant, isDeleted: tenant.deletedAt !== null };
  }

  /**
   * Slugs des tenants actifs, publics — utilisé par le sitemap.xml du
   * frontend pour référencer les pages /menu/[slug] réelles au lieu de
   * routes statiques génériques.
   */
  async findAllPublicSlugs() {
    return this.prisma.tenant.findMany({
      where: { deletedAt: null, status: 'active' },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 5000,
    });
  }

  async resolveBySlug(slug: string) {
    return this.prisma.tenant.findFirst({
      where: {
        slug,
        status: 'active',
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        status: true,
        logo: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(id: string, updateTenantDto: UpdateTenantDto) {
    return this.prisma.tenant.update({
      where: { id },
      data: updateTenantDto as any,
    });
  }

  async remove(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      throw new NotFoundException('Tenant introuvable');
    }
    if (tenant.deletedAt) {
      throw new ConflictException('Ce tenant est déjà supprimé');
    }
    // Domain n'a pas de deletedAt et son champ `domain` est @unique : on le
    // supprime réellement au soft-delete du tenant (ce n'est qu'un mapping
    // de vérification de domaine, pas une donnée métier à conserver), pour
    // qu'un futur tenant puisse réutiliser le même nom de domaine.
    return this.prisma.$transaction(async (tx) => {
      await tx.domain.deleteMany({ where: { tenantId: id } });
      return tx.tenant.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    });
  }

  async restore(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      throw new NotFoundException('Tenant introuvable');
    }
    if (!tenant.deletedAt) {
      throw new ConflictException("Ce tenant n'est pas supprimé");
    }
    return this.prisma.tenant.update({
      where: { id },
      data: { deletedAt: null },
    });
  }
}
