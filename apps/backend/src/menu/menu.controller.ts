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
import { MenuService } from './menu.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import type { Tenant } from '@prisma/client';

@Controller('/menu')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Public()
  @Get()
  findAll(
    @CurrentTenant() tenant: Tenant | undefined,
    @Query() query: PaginationQueryDto,
    @Query('availableOnly') availableOnly: string,
  ) {
    return this.menuService.findAll(
      tenant?.id,
      query,
      availableOnly === 'true',
    );
  }

  @Public()
  @Get(':id')
  findOne(
    @CurrentTenant() tenant: Tenant | undefined,
    @Param('id') id: string,
  ) {
    return this.menuService.findOne(tenant?.id, id);
  }

  @Post()
  @Roles('owner', 'manager', 'head_chef')
  create(@CurrentTenant() tenant: Tenant, @Body() data: CreateMenuItemDto) {
    return this.menuService.create(tenant.id, data);
  }

  @Patch(':id')
  @Roles('owner', 'manager', 'head_chef')
  update(
    @CurrentTenant() tenant: Tenant | undefined,
    @Param('id') id: string,
    @Body() data: UpdateMenuItemDto,
  ) {
    return this.menuService.update(tenant?.id, id, data);
  }

  @Delete(':id')
  @Roles('owner', 'manager', 'head_chef')
  remove(@CurrentTenant() tenant: Tenant | undefined, @Param('id') id: string) {
    return this.menuService.remove(tenant?.id, id);
  }
}
