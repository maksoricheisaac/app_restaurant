import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { Tenant } from '@prisma/client';

@Controller('/reservations')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get()
  @Roles('owner', 'manager', 'waiter')
  findAll(@CurrentTenant() tenant: Tenant | undefined, @Query() filters: any) {
    return this.reservationsService.findAll(tenant?.id, filters);
  }

  @Post()
  @Roles('owner', 'manager', 'waiter', 'user')
  create(
    @CurrentTenant() tenant: Tenant,
    @Body() data: CreateReservationDto,
    @CurrentUser() user: any,
  ) {
    return this.reservationsService.create(tenant.id, data, user?.id);
  }

  @Patch(':id/status')
  @Roles('owner', 'manager', 'waiter')
  updateStatus(
    @CurrentTenant() tenant: Tenant | undefined,
    @Param('id') id: string,
    @Body() dto: UpdateReservationStatusDto,
  ) {
    return this.reservationsService.updateStatus(tenant?.id, id, dto);
  }

  @Delete(':id')
  @Roles('owner', 'manager')
  remove(@CurrentTenant() tenant: Tenant | undefined, @Param('id') id: string) {
    return this.reservationsService.remove(tenant?.id, id);
  }
}
