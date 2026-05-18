import {
  Controller,
  Get,
  Body,
  Patch,
  Post,
  Delete,
  Param,
  UseGuards,
  ParseArrayPipe,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import {
  UpdateGeneralSettingsDto,
  OpeningHourDto,
  UpdateSocialLinksDto,
  UpdateLimitsDto,
  CreateDeliveryZoneDto,
  UpdateDeliveryZoneDto,
} from './dto/settings.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import type { Tenant } from '@prisma/client';

@Controller('/settings')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Roles('owner', 'manager', 'waiter', 'cashier', 'head_chef')
  findOne(@CurrentTenant() tenant: Tenant) {
    return this.settingsService.findByTenant(tenant.id);
  }

  @Patch()
  @Roles('owner', 'manager')
  update(
    @CurrentTenant() tenant: Tenant,
    @Body() data: UpdateGeneralSettingsDto,
  ) {
    return this.settingsService.update(tenant.id, data);
  }

  @Get('opening-hours')
  findOpeningHours(@CurrentTenant() tenant: Tenant) {
    return this.settingsService.findOpeningHours(tenant.id);
  }

  @Patch('opening-hours')
  @Roles('owner', 'manager')
  updateOpeningHours(
    @CurrentTenant() tenant: Tenant,
    @Body(new ParseArrayPipe({ items: OpeningHourDto })) hours: OpeningHourDto[],
  ) {
    return this.settingsService.updateOpeningHours(tenant.id, hours);
  }

  @Get('social-links')
  @Roles('owner', 'manager', 'waiter', 'cashier', 'head_chef')
  getSocialLinks(@CurrentTenant() tenant: Tenant) {
    return this.settingsService.getSocialLinks(tenant.id);
  }

  @Patch('social-links')
  @Roles('owner', 'manager')
  updateSocialLinks(
    @CurrentTenant() tenant: Tenant,
    @Body() data: UpdateSocialLinksDto,
  ) {
    return this.settingsService.updateSocialLinks(tenant.id, data);
  }

  @Get('limits')
  @Roles('owner', 'manager')
  getLimits(@CurrentTenant() tenant: Tenant) {
    return this.settingsService.getLimits(tenant.id);
  }

  @Patch('limits')
  @Roles('owner', 'manager')
  updateLimits(@CurrentTenant() tenant: Tenant, @Body() data: UpdateLimitsDto) {
    return this.settingsService.updateLimits(tenant.id, data);
  }

  @Get('delivery-zones')
  @Roles('owner', 'manager')
  findDeliveryZones(@CurrentTenant() tenant: Tenant) {
    return this.settingsService.findDeliveryZones(tenant.id);
  }

  @Post('delivery-zones')
  @Roles('owner', 'manager')
  createDeliveryZone(
    @CurrentTenant() tenant: Tenant,
    @Body() data: CreateDeliveryZoneDto,
  ) {
    return this.settingsService.createDeliveryZone(tenant.id, data);
  }

  @Patch('delivery-zones/:id')
  @Roles('owner', 'manager')
  updateDeliveryZone(
    @CurrentTenant() tenant: Tenant,
    @Param('id') id: string,
    @Body() data: UpdateDeliveryZoneDto,
  ) {
    return this.settingsService.updateDeliveryZone(tenant.id, id, data);
  }

  @Delete('delivery-zones/:id')
  @Roles('owner', 'manager')
  deleteDeliveryZone(@CurrentTenant() tenant: Tenant, @Param('id') id: string) {
    return this.settingsService.deleteDeliveryZone(tenant.id, id);
  }
}
