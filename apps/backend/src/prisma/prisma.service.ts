import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL,
      }),
    });

    // La suppression physique d'un Tenant entraînerait, via les relations
    // onDelete: Cascade, la perte de tout son historique métier. Seule la
    // suppression logique (TenantsService.remove -> deletedAt) est autorisée.
    const forbidPhysicalDelete = () => {
      throw new Error(
        'La suppression physique de Tenant est interdite. Utilisez TenantsService.remove() (soft-delete via deletedAt).',
      );
    };
    this.tenant.delete = forbidPhysicalDelete as any;
    this.tenant.deleteMany = forbidPhysicalDelete as any;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
