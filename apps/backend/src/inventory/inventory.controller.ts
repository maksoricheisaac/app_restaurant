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
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('/inventory')
@UseGuards(AuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('ingredients')
  @Roles('owner', 'manager', 'chef')
  findAllIngredients() {
    return this.inventoryService.findAllIngredients();
  }

  @Post('ingredients')
  @Roles('owner', 'manager', 'chef')
  createIngredient(@Body() data: CreateIngredientDto) {
    return this.inventoryService.createIngredient(data);
  }

  @Get('movements')
  @Roles('owner', 'manager', 'chef')
  findMovements(@Query() filters: MovementFiltersDto) {
    return this.inventoryService.findMovements(filters);
  }

  @Post('movements')
  @Roles('owner', 'manager', 'chef')
  addStockMovement(
    @Body() data: CreateStockMovementDto,
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.addStockMovement(data, user?.id);
  }

  @Get('low-stock')
  @Roles('owner', 'manager', 'chef')
  getLowStockAlerts(@Query('threshold') threshold?: string) {
    return this.inventoryService.getLowStockAlerts(
      threshold ? Number(threshold) : 10,
    );
  }

  @Get('recipes')
  @Roles('owner', 'manager', 'chef')
  findAllRecipes() {
    return this.inventoryService.findAllRecipes();
  }

  @Post('recipes')
  @Roles('owner', 'manager', 'chef')
  createRecipe(@Body() data: CreateRecipeDto) {
    return this.inventoryService.createRecipe(data);
  }

  @Patch('recipes/:id')
  @Roles('owner', 'manager', 'chef')
  updateRecipe(@Param('id') id: string, @Body() data: UpdateRecipeDto) {
    return this.inventoryService.updateRecipe(id, data);
  }

  @Delete('recipes/:id')
  @Roles('owner', 'manager', 'chef')
  deleteRecipe(@Param('id') id: string) {
    return this.inventoryService.deleteRecipe(id);
  }

  @Get('dashboard')
  @Roles('owner', 'manager', 'chef')
  getDashboard() {
    return this.inventoryService.getDashboard();
  }
}
