import { Module } from '@nestjs/common';
import { RevenueService } from './revenue.service';
import { PrismaModule } from '../../prisma/prisma.module';

/**
 * Source unique du chiffre d'affaires. Tout écran qui affiche un montant de
 * ventes passe par ici — c'est ce qui garantit que deux écrans ne peuvent
 * plus annoncer deux totaux différents pour la même journée.
 */
@Module({
  imports: [PrismaModule],
  providers: [RevenueService],
  exports: [RevenueService],
})
export class RevenueModule {}
