import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

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

  async findAll() {
    return this.prisma.tenant.findMany();
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
    return this.prisma.tenant.update({
      where: { id },
      // TenantStatus enum has no 'inactive' — 'suspended' is the correct soft-delete value.
      data: { status: 'suspended' as any },
    });
  }
}
