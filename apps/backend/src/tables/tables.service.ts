import {
  Injectable,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlanLimitService } from '../plans/plans.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';

const NOT_DELETED = { deletedAt: null };

@Injectable()
export class TablesService {
  constructor(
    private prisma: PrismaService,
    private planLimitService: PlanLimitService,
  ) {}

  async findAll(tenantId: string | undefined) {
    if (!tenantId) throw new ForbiddenException('Tenant context required');
    return this.prisma.table.findMany({
      where: { tenantId, ...NOT_DELETED },
      include: { _count: { select: { orders: true, reservations: true } } },
      orderBy: { number: 'asc' },
    });
  }

  async findOne(tenantId: string | undefined, id: string) {
    if (!tenantId) throw new ForbiddenException('Tenant context required');
    return this.prisma.table.findFirst({
      where: { id, tenantId, ...NOT_DELETED },
    });
  }

  async create(tenantId: string, data: CreateTableDto) {
    await this.planLimitService.assertTableLimit(tenantId);

    const existing = await this.prisma.table.findFirst({
      where: { tenantId, number: data.number, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException(`La table numéro ${data.number} existe déjà`);
    }
    return this.prisma.table.create({
      data: { ...data, tenantId },
    });
  }

  async update(tenantId: string | undefined, id: string, data: UpdateTableDto) {
    if (!tenantId) throw new ForbiddenException('Tenant context required');
    // Si le numéro change, vérifier l'unicité parmi les tables actives
    if (data.number !== undefined) {
      const conflict = await this.prisma.table.findFirst({
        where: { tenantId, number: data.number, deletedAt: null, NOT: { id } },
      });
      if (conflict) {
        throw new ConflictException(
          `La table numéro ${data.number} existe déjà`,
        );
      }
    }
    return this.prisma.table.update({
      where: { id, tenantId },
      data,
    });
  }

  async remove(tenantId: string | undefined, id: string) {
    if (!tenantId) throw new ForbiddenException('Tenant context required');
    return this.prisma.table.update({
      where: { id, tenantId },
      data: { deletedAt: new Date() },
    });
  }

  async findLocations(tenantId: string) {
    const tables = await this.prisma.table.findMany({
      where: { tenantId, location: { not: null }, ...NOT_DELETED },
      select: { location: true },
      distinct: ['location'],
    });
    return tables.map((t) => t.location).filter(Boolean);
  }
}
