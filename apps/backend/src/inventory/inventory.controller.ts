import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import {
  CreateIngredientDto,
  CreateStockMovementDto,
  MovementFiltersDto,
  CreateRecipeDto,
  UpdateRecipeDto,
} from './dto/inventory.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { Tenant } from '@prisma/client';

@Controller('/inventory')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('ingredients')
  @Roles('owner', 'manager', 'head_chef', 'chef')
  findAllIngredients(@CurrentTenant() tenant: Tenant | undefined) {
    return this.inventoryService.findAllIngredients(tenant?.id);
  }

  @Post('ingredients')
  @Roles('owner', 'manager', 'head_chef')
  createIngredient(
    @CurrentTenant() tenant: Tenant,
    @Body() data: CreateIngredientDto,
  ) {
    return this.inventoryService.createIngredient(tenant.id, data);
  }

  @Get('movements')
  @Roles('owner', 'manager', 'head_chef', 'chef')
  findMovements(
    @CurrentTenant() tenant: Tenant,
    @Query() filters: MovementFiltersDto,
  ) {
    return this.inventoryService.findMovements(tenant.id, filters);
  }

  @Post('movements')
  @Roles('owner', 'manager', 'head_chef', 'chef')
  addStockMovement(
    @CurrentTenant() tenant: Tenant,
    @Body() data: CreateStockMovementDto,
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.addStockMovement(tenant.id, data, user?.id);
  }

  @Get('low-stock')
  @Roles('owner', 'manager', 'head_chef')
  getLowStockAlerts(
    @CurrentTenant() tenant: Tenant,
    @Query('threshold') threshold?: string,
  ) {
    return this.inventoryService.getLowStockAlerts(
      tenant.id,
      threshold ? Number(threshold) : 10,
    );
  }

  @Get('recipes')
  @Roles('owner', 'manager', 'head_chef', 'chef')
  findAllRecipes(@CurrentTenant() tenant: Tenant) {
    return this.inventoryService.findAllRecipes(tenant.id);
  }

  @Post('recipes')
  @Roles('owner', 'manager', 'head_chef')
  createRecipe(@CurrentTenant() tenant: Tenant, @Body() data: CreateRecipeDto) {
    return this.inventoryService.createRecipe(tenant.id, data);
  }

  @Patch('recipes/:id')
  @Roles('owner', 'manager', 'head_chef')
  updateRecipe(
    @CurrentTenant() tenant: Tenant,
    @Param('id') id: string,
    @Body() data: UpdateRecipeDto,
  ) {
    return this.inventoryService.updateRecipe(tenant.id, id, data);
  }

  @Delete('recipes/:id')
  @Roles('owner', 'manager', 'head_chef')
  deleteRecipe(@CurrentTenant() tenant: Tenant, @Param('id') id: string) {
    return this.inventoryService.deleteRecipe(tenant.id, id);
  }

  @Get('dashboard')
  @Roles('owner', 'manager', 'head_chef')
  getDashboard(@CurrentTenant() tenant: Tenant | undefined) {
    return this.inventoryService.getDashboard(tenant?.id);
  }
}
