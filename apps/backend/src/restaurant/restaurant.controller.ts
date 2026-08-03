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
import { RestaurantService } from './restaurant.service';
import {
  UpdateRestaurantIdentityDto,
  UpdateSocialLinksDto,
  UpdateServiceSettingsDto,
  UpdateCashSettingsDto,
  UpdatePrintingSettingsDto,
  OpeningHourDto,
  CreateDeliveryZoneDto,
  UpdateDeliveryZoneDto,
} from './dto/restaurant.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

const ALL_STAFF = ['owner', 'manager', 'waiter', 'cashier', 'chef'] as const;
const ADMIN = ['owner', 'manager'] as const;

@Controller('/restaurant')
@UseGuards(AuthGuard, RolesGuard)
export class RestaurantController {
  constructor(private readonly restaurant: RestaurantService) {}

  /** Profil affiché par le site vitrine et la carte publique. */
  @Public()
  @Get('public')
  getPublicProfile() {
    return this.restaurant.getPublicProfile();
  }

  @Public()
  @Get('opening-hours')
  findOpeningHours() {
    return this.restaurant.findOpeningHours();
  }

  @Get()
  @Roles(...ALL_STAFF)
  get() {
    return this.restaurant.get();
  }

  @Patch()
  @Roles(...ADMIN)
  updateIdentity(@Body() data: UpdateRestaurantIdentityDto) {
    return this.restaurant.updateIdentity(data);
  }

  @Patch('social-links')
  @Roles(...ADMIN)
  updateSocialLinks(@Body() data: UpdateSocialLinksDto) {
    return this.restaurant.updateSocialLinks(data);
  }

  @Patch('service')
  @Roles(...ADMIN)
  updateService(@Body() data: UpdateServiceSettingsDto) {
    return this.restaurant.updateServiceSettings(data);
  }

  @Patch('cash')
  @Roles('owner')
  updateCash(@Body() data: UpdateCashSettingsDto) {
    return this.restaurant.updateCashSettings(data);
  }

  @Patch('printing')
  @Roles(...ADMIN)
  updatePrinting(@Body() data: UpdatePrintingSettingsDto) {
    return this.restaurant.updatePrintingSettings(data);
  }

  @Patch('opening-hours')
  @Roles(...ADMIN)
  updateOpeningHours(
    @Body(new ParseArrayPipe({ items: OpeningHourDto }))
    hours: OpeningHourDto[],
  ) {
    return this.restaurant.updateOpeningHours(hours);
  }

  @Get('closures')
  @Roles(...ALL_STAFF)
  findClosures() {
    return this.restaurant.findExceptionalClosures();
  }

  @Post('closures')
  @Roles(...ADMIN)
  createClosure(@Body() body: { date: string; reason?: string }) {
    return this.restaurant.createExceptionalClosure(
      new Date(body.date),
      body.reason,
    );
  }

  @Delete('closures/:id')
  @Roles(...ADMIN)
  deleteClosure(@Param('id') id: string) {
    return this.restaurant.deleteExceptionalClosure(id);
  }

  @Get('delivery-zones')
  @Roles(...ALL_STAFF)
  findDeliveryZones() {
    return this.restaurant.findDeliveryZones();
  }

  @Post('delivery-zones')
  @Roles(...ADMIN)
  createDeliveryZone(@Body() data: CreateDeliveryZoneDto) {
    return this.restaurant.createDeliveryZone(data);
  }

  @Patch('delivery-zones/:id')
  @Roles(...ADMIN)
  updateDeliveryZone(
    @Param('id') id: string,
    @Body() data: UpdateDeliveryZoneDto,
  ) {
    return this.restaurant.updateDeliveryZone(id, data);
  }

  @Delete('delivery-zones/:id')
  @Roles(...ADMIN)
  deleteDeliveryZone(@Param('id') id: string) {
    return this.restaurant.deleteDeliveryZone(id);
  }
}
