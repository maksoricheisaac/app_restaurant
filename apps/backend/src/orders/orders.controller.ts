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
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderFiltersDto } from './dto/order-filters.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { Tenant } from '@prisma/client';

@Controller('/orders')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @Roles('owner', 'manager', 'waiter', 'cashier', 'head_chef', 'chef')
  findAll(@CurrentTenant() tenant: Tenant | undefined, @Query() filters: OrderFiltersDto) {
    return this.ordersService.findAll(tenant?.id, filters);
  }

  @Get(':id')
  @Roles('owner', 'manager', 'waiter', 'cashier', 'head_chef', 'chef')
  findOne(@CurrentTenant() tenant: Tenant | undefined, @Param('id') id: string) {
    return this.ordersService.findOne(tenant?.id, id);
  }

  @Post()
  @Roles('owner', 'manager', 'waiter', 'cashier')
  create(
    @CurrentTenant() tenant: Tenant,
    @Body() data: CreateOrderDto,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.create(tenant.id, data, user?.id);
  }

  @Patch(':id/status')
  @Roles('owner', 'manager', 'waiter', 'head_chef', 'chef')
  updateStatus(
    @CurrentTenant() tenant: Tenant | undefined,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(tenant?.id, id, dto);
  }

  @Delete(':id')
  @Roles('owner', 'manager')
  remove(@CurrentTenant() tenant: Tenant | undefined, @Param('id') id: string) {
    return this.ordersService.remove(tenant?.id, id);
  }

  @Public()
  @Get(':id/tracking')
  getTracking(@Param('id') id: string) {
    return this.ordersService.getTracking(id);
  }
}
