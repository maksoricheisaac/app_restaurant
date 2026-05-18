import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const NOT_DELETED = { deletedAt: null };

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string | undefined, filters: any) {
    if (!tenantId) throw new ForbiddenException('Tenant context required');
    const { search, page = 1, limit = 10 } = filters;
    const take = Math.min(Number(limit), 100);
    const skip = (page - 1) * take;

    const where = {
      tenantId,
      ...NOT_DELETED,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
              { phone: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        include: { _count: { select: { orders: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page: Number(page),
        limit: take,
        total,
        pages: Math.ceil(total / take),
      },
    };
  }

  async findOne(tenantId: string | undefined, id: string) {
    if (!tenantId) throw new ForbiddenException('Tenant context required');
    return this.prisma.customer.findFirst({
      where: { id, tenantId, ...NOT_DELETED },
      include: { orders: { take: 10, orderBy: { createdAt: 'desc' } } },
    });
  }

  async create(tenantId: string, data: any) {
    return this.prisma.customer.create({
      data: { ...data, tenantId },
    });
  }

  async update(tenantId: string | undefined, id: string, data: any) {
    if (!tenantId) throw new ForbiddenException('Tenant context required');
    return this.prisma.customer.update({
      where: { id, tenantId },
      data,
    });
  }

  async remove(tenantId: string | undefined, id: string) {
    if (!tenantId) throw new ForbiddenException('Tenant context required');
    return this.prisma.customer.update({
      where: { id, tenantId },
      data: { deletedAt: new Date() },
    });
  }
}
