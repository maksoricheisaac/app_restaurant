import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customers.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import type { Tenant } from '@prisma/client';

@Controller('/customers')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @Roles('owner', 'manager', 'waiter', 'cashier')
  findAll(@CurrentTenant() tenant: Tenant | undefined, @Query() filters: any) {
    return this.customersService.findAll(tenant?.id, filters);
  }

  @Get(':id')
  @Roles('owner', 'manager', 'waiter', 'cashier')
  findOne(@CurrentTenant() tenant: Tenant | undefined, @Param('id') id: string) {
    return this.customersService.findOne(tenant?.id, id);
  }

  @Post()
  @Roles('owner', 'manager', 'waiter', 'cashier')
  create(@CurrentTenant() tenant: Tenant, @Body() data: CreateCustomerDto) {
    return this.customersService.create(tenant.id, data);
  }

  @Patch(':id')
  @Roles('owner', 'manager')
  update(
    @CurrentTenant() tenant: Tenant | undefined,
    @Param('id') id: string,
    @Body() data: UpdateCustomerDto,
  ) {
    return this.customersService.update(tenant?.id, id, data);
  }

  @Delete(':id')
  @Roles('owner', 'manager')
  remove(@CurrentTenant() tenant: Tenant | undefined, @Param('id') id: string) {
    return this.customersService.remove(tenant?.id, id);
  }
}
