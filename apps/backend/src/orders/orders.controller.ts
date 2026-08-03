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
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('/orders')
@UseGuards(AuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @Roles('owner', 'manager', 'waiter', 'cashier', 'chef')
  findAll(@Query() filters: OrderFiltersDto) {
    return this.ordersService.findAll(filters);
  }

  /**
   * Écran cuisine (KDS) — commandes actives (en attente + en préparation).
   */
  @Get('kitchen')
  @Roles('owner', 'manager', 'chef')
  getKitchenOrders() {
    return this.ordersService.findKitchenOrders();
  }

  @Get(':id')
  @Roles('owner', 'manager', 'waiter', 'cashier', 'chef')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Post()
  @Roles('owner', 'manager', 'waiter', 'cashier')
  create(@Body() data: CreateOrderDto, @CurrentUser() user: any) {
    return this.ordersService.create(data, user?.id);
  }

  @Patch(':id/status')
  @Roles('owner', 'manager', 'waiter', 'chef')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }

  @Delete(':id')
  @Roles('owner', 'manager')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }

  @Public()
  @Get(':id/tracking')
  getTracking(@Param('id') id: string) {
    return this.ordersService.getTracking(id);
  }
}
