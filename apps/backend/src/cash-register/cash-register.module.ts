import { Module } from '@nestjs/common';
import { CashRegisterService } from './cash-register.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CashRegisterController } from './cash-register.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CashRegisterController],
  providers: [CashRegisterService],
  exports: [CashRegisterService],
})
export class CashRegisterModule {}
