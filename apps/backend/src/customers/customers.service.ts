import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const NOT_DELETED = { deletedAt: null };

export interface UpsertCustomerInput {
  tenantId: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
}

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

  /**
   * Upsert a customer from an order or reservation interaction.
   * Matches on email if provided, then phone, otherwise creates a new record.
   * This is the ONLY path to create customers — no manual creation endpoint.
   */
  async upsertFromInteraction(
    input: UpsertCustomerInput,
  ): Promise<string | null> {
    const { tenantId, name, email, phone } = input;
    if (!email && !phone && !name) return null;

    // Try to find existing (non-deleted) customer by email or phone
    const existing = await this.prisma.customer.findFirst({
      where: {
        tenantId,
        deletedAt: null,
        ...(email ? { email } : phone ? { phone } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      // Update name/phone if we now have more data
      const updateData: any = {};
      if (name) updateData.name = name;
      if (phone) updateData.phone = phone;
      if (Object.keys(updateData).length) {
        await this.prisma.customer.update({
          where: { id: existing.id },
          data: updateData,
        });
      }
      return existing.id;
    }

    const customer = await this.prisma.customer.create({
      data: {
        tenantId,
        name: name ?? undefined,
        email: email ?? undefined,
        phone: phone ?? undefined,
      },
    });
    return customer.id;
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
