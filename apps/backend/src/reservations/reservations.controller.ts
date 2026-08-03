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
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('/reservations')
@UseGuards(AuthGuard, RolesGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get()
  @Roles('owner', 'manager', 'waiter')
  findAll(@Query() filters: any) {
    return this.reservationsService.findAll(filters);
  }

  @Post()
  @Roles('owner', 'manager', 'waiter', 'user')
  create(@Body() data: CreateReservationDto, @CurrentUser() user: any) {
    return this.reservationsService.create(data, user?.id);
  }

  @Patch(':id/status')
  @Roles('owner', 'manager', 'waiter')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateReservationStatusDto,
  ) {
    return this.reservationsService.updateStatus(id, dto);
  }

  @Delete(':id')
  @Roles('owner', 'manager')
  remove(@Param('id') id: string) {
    return this.reservationsService.remove(id);
  }
}
