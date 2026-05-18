import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { TablesService } from './tables.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import type { Tenant } from '@prisma/client';

@Controller('/tables')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get()
  @Roles('owner', 'manager', 'waiter', 'cashier')
  findAll(@CurrentTenant() tenant: Tenant | undefined) {
    return this.tablesService.findAll(tenant?.id);
  }

  @Get('locations')
  @Roles('owner', 'manager', 'waiter', 'cashier')
  findLocations(@CurrentTenant() tenant: Tenant) {
    return this.tablesService.findLocations(tenant.id);
  }

  @Post()
  @Roles('owner', 'manager')
  create(@CurrentTenant() tenant: Tenant, @Body() data: CreateTableDto) {
    return this.tablesService.create(tenant.id, data);
  }

  @Patch(':id')
  @Roles('owner', 'manager')
  update(
    @CurrentTenant() tenant: Tenant | undefined,
    @Param('id') id: string,
    @Body() data: UpdateTableDto,
  ) {
    return this.tablesService.update(tenant?.id, id, data);
  }

  @Delete(':id')
  @Roles('owner', 'manager')
  remove(@CurrentTenant() tenant: Tenant | undefined, @Param('id') id: string) {
    return this.tablesService.remove(tenant?.id, id);
  }
}
