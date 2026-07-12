import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DomainsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Tous les domaines personnalisés, avec le restaurant rattaché (Super Admin). */
  listAll() {
    return this.prisma.domain.findMany({
      include: { tenant: { select: { id: true, name: true, slug: true } } },
      orderBy: { domain: 'asc' },
    });
  }
}
