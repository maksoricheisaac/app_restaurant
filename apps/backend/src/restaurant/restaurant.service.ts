import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RESTAURANT_ID } from './restaurant.constants';
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

const NOT_DELETED = { deletedAt: null };

/**
 * Configuration de l'unique établissement.
 *
 * Toutes les écritures ciblent la même ligne (`RESTAURANT_ID`) : il n'y a ni
 * identifiant à passer, ni vérification d'appartenance à faire. Ce qui
 * demandait autrefois une résolution de tenant puis un contrôle de propriété
 * sur chaque enregistrement est devenu un simple accès par clé primaire.
 */
@Injectable()
export class RestaurantService {
  constructor(private prisma: PrismaService) {}

  /**
   * Profil complet de l'établissement. Lève une 404 tant que l'assistant de
   * première installation n'a pas été exécuté — c'est ce qui déclenche la
   * redirection du frontend vers `/setup`.
   */
  async get() {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: RESTAURANT_ID },
    });
    if (!restaurant) {
      throw new NotFoundException(
        "Le restaurant n'est pas encore configuré. Lancez l'assistant de première installation.",
      );
    }
    return restaurant;
  }

  /** Version publique : uniquement ce que le site vitrine doit exposer. */
  async getPublicProfile() {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: RESTAURANT_ID },
      select: {
        name: true,
        slogan: true,
        description: true,
        cuisineType: true,
        logo: true,
        bannerUrl: true,
        primaryColor: true,
        phone: true,
        email: true,
        address: true,
        website: true,
        currency: true,
        timezone: true,
        facebookUrl: true,
        instagramUrl: true,
        twitterUrl: true,
        youtubeUrl: true,
        dineInEnabled: true,
        takeawayEnabled: true,
        deliveryEnabled: true,
        maxReservationGuests: true,
        maxDaysInAdvance: true,
      },
    });
    if (!restaurant) {
      throw new NotFoundException("Le restaurant n'est pas encore configuré.");
    }
    return restaurant;
  }

  /** Devise + fuseau, seules données de config lues à chaud par les rapports. */
  async getLocale() {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: RESTAURANT_ID },
      select: { currency: true, timezone: true },
    });
    return restaurant ?? { currency: 'EUR', timezone: 'Europe/Paris' };
  }

  private update(data: Prisma.RestaurantUpdateInput) {
    return this.prisma.restaurant.update({
      where: { id: RESTAURANT_ID },
      data,
    });
  }

  updateIdentity(data: UpdateRestaurantIdentityDto) {
    return this.update(data);
  }

  updateSocialLinks(data: UpdateSocialLinksDto) {
    return this.update(data);
  }

  updateServiceSettings(data: UpdateServiceSettingsDto) {
    return this.update(data);
  }

  updateCashSettings(data: UpdateCashSettingsDto) {
    return this.update(data);
  }

  updatePrintingSettings(data: UpdatePrintingSettingsDto) {
    return this.update(data);
  }

  // ─── Horaires ─────────────────────────────────────────────────────────────

  findOpeningHours() {
    return this.prisma.openingHours.findMany({ orderBy: { dayOfWeek: 'asc' } });
  }

  updateOpeningHours(hours: OpeningHourDto[]) {
    return this.prisma.$transaction(
      hours.map((hour) =>
        this.prisma.openingHours.upsert({
          where: { dayOfWeek: hour.dayOfWeek },
          update: {
            openTime: hour.openTime,
            closeTime: hour.closeTime,
            isClosed: hour.isClosed,
          },
          create: {
            dayOfWeek: hour.dayOfWeek,
            openTime: hour.openTime,
            closeTime: hour.closeTime,
            isClosed: hour.isClosed,
          },
        }),
      ),
    );
  }

  findExceptionalClosures() {
    return this.prisma.exceptionalClosure.findMany({
      orderBy: { date: 'asc' },
    });
  }

  createExceptionalClosure(date: Date, reason?: string) {
    return this.prisma.exceptionalClosure.create({ data: { date, reason } });
  }

  async deleteExceptionalClosure(id: string) {
    const closure = await this.prisma.exceptionalClosure.findUnique({
      where: { id },
    });
    if (!closure) throw new NotFoundException('Fermeture introuvable');
    return this.prisma.exceptionalClosure.delete({ where: { id } });
  }

  // ─── Zones de livraison ───────────────────────────────────────────────────

  findDeliveryZones() {
    return this.prisma.deliveryZone.findMany({
      where: NOT_DELETED,
      orderBy: { createdAt: 'asc' },
    });
  }

  createDeliveryZone(data: CreateDeliveryZoneDto) {
    return this.prisma.deliveryZone.create({ data });
  }

  async updateDeliveryZone(id: string, data: UpdateDeliveryZoneDto) {
    const zone = await this.prisma.deliveryZone.findFirst({
      where: { id, ...NOT_DELETED },
    });
    if (!zone) throw new NotFoundException('Zone de livraison introuvable');

    return this.prisma.deliveryZone.update({ where: { id }, data });
  }

  async deleteDeliveryZone(id: string) {
    const zone = await this.prisma.deliveryZone.findFirst({
      where: { id, ...NOT_DELETED },
    });
    if (!zone) throw new NotFoundException('Zone de livraison introuvable');

    return this.prisma.deliveryZone.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
