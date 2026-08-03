import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const NOT_DELETED = { deletedAt: null };

export interface UpsertCustomerInput {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
}

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: any) {
    const { search, page = 1, limit = 10 } = filters;
    const take = Math.min(Number(limit), 100);
    const skip = (page - 1) * take;

    const where = {
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

  findOne(id: string) {
    return this.prisma.customer.findFirst({
      where: { id, ...NOT_DELETED },
      include: { orders: { take: 10, orderBy: { createdAt: 'desc' } } },
    });
  }

  /**
   * Crée ou met à jour un client à partir d'une commande ou d'une réservation.
   * Rapprochement sur l'email s'il est fourni, sinon sur le téléphone.
   * C'est le SEUL chemin de création d'un client — il n'existe pas
   * d'endpoint de création manuelle.
   */
  async upsertFromInteraction(
    input: UpsertCustomerInput,
  ): Promise<string | null> {
    const { name, email, phone } = input;
    if (!email && !phone && !name) return null;

    const existing = await this.prisma.customer.findFirst({
      where: {
        deletedAt: null,
        ...(email ? { email } : phone ? { phone } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      // Complète la fiche si l'interaction apporte des informations nouvelles
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
        name: name ?? undefined,
        email: email ?? undefined,
        phone: phone ?? undefined,
      },
    });
    return customer.id;
  }

  update(id: string, data: any) {
    return this.prisma.customer.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
