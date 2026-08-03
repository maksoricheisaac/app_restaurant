import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../../auth/auth.module';

/**
 * Global : n'importe quel service métier doit pouvoir consigner un fait sans
 * qu'on ait à ajouter un import dans son module — c'est ce qui garantit que
 * la traçabilité ne sera pas omise par simple friction de câblage.
 */
@Global()
@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
