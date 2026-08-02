import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { MenuOptionsService } from './menu-options.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import type { Tenant } from '@prisma/client';
import {
  CreateOptionGroupDto,
  UpdateOptionGroupDto,
  CreateOptionDto,
  UpdateOptionDto,
} from './dto/menu-option.dto';

/**
 * Gestion admin des options de plats. Préfixe dédié `/menu-options` pour éviter
 * toute ambiguïté de routing avec `GET /menu/:id`.
 */
@Controller('/menu-options')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
export class MenuOptionsController {
  constructor(private readonly service: MenuOptionsService) {}

  @Get('item/:menuItemId')
  @Roles('owner', 'manager', 'head_chef')
  listForItem(
    @CurrentTenant() tenant: Tenant,
    @Param('menuItemId') menuItemId: string,
  ) {
    return this.service.listForItem(tenant.id, menuItemId);
  }

  @Post('groups')
  @Roles('owner', 'manager', 'head_chef')
  createGroup(
    @CurrentTenant() tenant: Tenant,
    @Body() dto: CreateOptionGroupDto,
  ) {
    return this.service.createGroup(tenant.id, dto);
  }

  @Patch('groups/:id')
  @Roles('owner', 'manager', 'head_chef')
  updateGroup(
    @CurrentTenant() tenant: Tenant,
    @Param('id') id: string,
    @Body() dto: UpdateOptionGroupDto,
  ) {
    return this.service.updateGroup(tenant.id, id, dto);
  }

  @Delete('groups/:id')
  @Roles('owner', 'manager', 'head_chef')
  removeGroup(@CurrentTenant() tenant: Tenant, @Param('id') id: string) {
    return this.service.removeGroup(tenant.id, id);
  }

  @Post('options')
  @Roles('owner', 'manager', 'head_chef')
  createOption(@CurrentTenant() tenant: Tenant, @Body() dto: CreateOptionDto) {
    return this.service.createOption(tenant.id, dto);
  }

  @Patch('options/:id')
  @Roles('owner', 'manager', 'head_chef')
  updateOption(
    @CurrentTenant() tenant: Tenant,
    @Param('id') id: string,
    @Body() dto: UpdateOptionDto,
  ) {
    return this.service.updateOption(tenant.id, id, dto);
  }

  @Delete('options/:id')
  @Roles('owner', 'manager', 'head_chef')
  removeOption(@CurrentTenant() tenant: Tenant, @Param('id') id: string) {
    return this.service.removeOption(tenant.id, id);
  }
}
