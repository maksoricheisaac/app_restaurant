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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import type { Tenant } from '@prisma/client';

@Controller('/categories')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Get()
  findAll(@CurrentTenant() tenant: Tenant | undefined) {
    return this.categoriesService.findAll(tenant?.id);
  }

  @Post()
  @Roles('owner', 'manager', 'head_chef')
  create(@CurrentTenant() tenant: Tenant, @Body() data: CreateCategoryDto) {
    return this.categoriesService.create(tenant.id, data);
  }

  @Patch(':id')
  @Roles('owner', 'manager', 'head_chef')
  update(
    @CurrentTenant() tenant: Tenant | undefined,
    @Param('id') id: string,
    @Body() data: CreateCategoryDto,
  ) {
    return this.categoriesService.update(tenant?.id, id, data);
  }

  @Delete(':id')
  @Roles('owner', 'manager', 'head_chef')
  remove(@CurrentTenant() tenant: Tenant | undefined, @Param('id') id: string) {
    return this.categoriesService.remove(tenant?.id, id);
  }
}
