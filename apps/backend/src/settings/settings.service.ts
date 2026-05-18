import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  UpdateGeneralSettingsDto,
  OpeningHourDto,
  UpdateSocialLinksDto,
  UpdateLimitsDto,
  CreateDeliveryZoneDto,
  UpdateDeliveryZoneDto,
} from './dto/settings.dto';

const NOT_DELETED = { deletedAt: null };

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async findByTenant(tenantId: string) {
    let settings = await this.prisma.restaurantSettings.findUnique({
      where: { tenantId },
    });

    if (!settings) {
      settings = await this.prisma.restaurantSettings.create({
        data: {
          tenantId,
          name: 'Mon Restaurant',
        },
      });
    }

    return settings;
  }

  async update(tenantId: string, data: UpdateGeneralSettingsDto) {
    return this.prisma.restaurantSettings.update({
      where: { tenantId },
      data,
    });
  }

  async findOpeningHours(tenantId: string) {
    return this.prisma.openingHours.findMany({
      where: { tenantId },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async updateOpeningHours(tenantId: string, hours: OpeningHourDto[]) {
    return this.prisma.$transaction(
      hours.map((hour) =>
        this.prisma.openingHours.upsert({
          where: {
            tenantId_dayOfWeek: {
              tenantId,
              dayOfWeek: hour.dayOfWeek as any,
            },
          },
          update: {
            openTime: hour.openTime,
            closeTime: hour.closeTime,
            isClosed: hour.isClosed,
          },
          create: {
            tenantId,
            dayOfWeek: hour.dayOfWeek as any,
            openTime: hour.openTime,
            closeTime: hour.closeTime,
            isClosed: hour.isClosed,
          },
        }),
      ),
    );
  }

  async getSocialLinks(tenantId: string) {
    const settings = await this.findByTenant(tenantId);
    return {
      facebookUrl: settings.facebookUrl,
      instagramUrl: settings.instagramUrl,
      twitterUrl: settings.twitterUrl,
      youtubeUrl: settings.youtubeUrl,
    };
  }

  async updateSocialLinks(tenantId: string, data: UpdateSocialLinksDto) {
    await this.findByTenant(tenantId);
    return this.prisma.restaurantSettings.update({
      where: { tenantId },
      data,
    });
  }

  async getLimits(tenantId: string) {
    const settings = await this.findByTenant(tenantId);
    return {
      maxOrdersPerHour: settings.maxOrdersPerHour,
      maxOrdersPerUserHour: settings.maxOrdersPerUserHour,
      maxReservationGuests: settings.maxReservationGuests,
      maxDaysInAdvance: settings.maxDaysInAdvance,
    };
  }

  async updateLimits(tenantId: string, data: UpdateLimitsDto) {
    await this.findByTenant(tenantId);
    return this.prisma.restaurantSettings.update({
      where: { tenantId },
      data,
    });
  }

  async findDeliveryZones(tenantId: string) {
    return this.prisma.deliveryZone.findMany({
      where: { tenantId, ...NOT_DELETED },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createDeliveryZone(tenantId: string, data: CreateDeliveryZoneDto) {
    return this.prisma.deliveryZone.create({
      data: { ...data, tenantId },
    });
  }

  async updateDeliveryZone(
    tenantId: string,
    id: string,
    data: UpdateDeliveryZoneDto,
  ) {
    const zone = await this.prisma.deliveryZone.findFirst({
      where: { id, tenantId, ...NOT_DELETED },
    });
    if (!zone) throw new NotFoundException('Delivery zone not found');

    return this.prisma.deliveryZone.update({ where: { id }, data });
  }

  async deleteDeliveryZone(tenantId: string, id: string) {
    const zone = await this.prisma.deliveryZone.findFirst({
      where: { id, tenantId, ...NOT_DELETED },
    });
    if (!zone) throw new NotFoundException('Delivery zone not found');

    return this.prisma.deliveryZone.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
