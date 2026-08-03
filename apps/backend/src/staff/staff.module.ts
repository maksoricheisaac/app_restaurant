import { Module } from '@nestjs/common';
import { StaffService } from './staff.service';
import { StaffController } from './staff.controller';
import { InvitesController } from './invites.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { RestaurantModule } from '../restaurant/restaurant.module';

@Module({
  imports: [PrismaModule, MailModule, RestaurantModule],
  controllers: [StaffController, InvitesController],
  providers: [StaffService],
  exports: [StaffService],
})
export class StaffModule {}
