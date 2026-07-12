import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { PlansService } from './plans.catalog.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

/**
 * Administration des plans (Super Admin uniquement). Permet de créer, modifier,
 * activer/désactiver et supprimer les offres. Toute écriture invalide le cache
 * du catalogue → répercutée immédiatement sur l'onboarding, la page Pricing et
 * l'enforcement des quotas.
 */
@Controller('/admin/plans')
@UseGuards(AuthGuard, RolesGuard)
@Roles('super_admin')
export class AdminPlansController {
  constructor(private readonly plans: PlansService) {}

  @Get()
  list() {
    return this.plans.adminList();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.plans.adminGet(id);
  }

  @Post()
  create(@Body() dto: CreatePlanDto) {
    return this.plans.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.plans.update(id, dto);
  }

  @Patch(':id/active')
  setActive(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.plans.setActive(id, isActive);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.plans.remove(id);
  }
}
