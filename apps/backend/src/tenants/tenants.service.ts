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
    } catch (error) {
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
    return this.prisma.tenant.findUnique({
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
    return this.prisma.tenant.update({
      where: { id },
      data: { deletedAt: new Date() },
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
