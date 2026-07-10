import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Headers,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Public } from '../common/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';
import { MenuService } from './menu.service';
import { MenuSessionService } from './menu-session.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  PublicOrderService,
  PublicCreateOrderDto,
} from './public-orders.service';
import { ReservationsService } from '../reservations/reservations.service';
import { stripHtml } from '../common/utils/sanitize';

export class PublicCreateReservationDto {
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  time?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  guests?: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  customerName: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;
}

@Controller('/public-menu')
export class PublicMenuController {
  constructor(
    private readonly menuService: MenuService,
    private readonly prisma: PrismaService,
    private readonly publicOrderService: PublicOrderService,
    private readonly menuSession: MenuSessionService,
    private readonly reservationsService: ReservationsService,
  ) {}

  @Public()
  @Throttle({ short: { limit: 60, ttl: 60_000 } })
  @Get('by-table/:tableId')
  async findByTableId(@Param('tableId') tableId: string) {
    const table = await this.prisma.table.findUnique({
      where: { id: tableId },
      include: { tenant: { select: { slug: true, name: true } } },
    });
    if (!table) throw new NotFoundException('Table introuvable');
    return {
      slug: table.tenant.slug,
      tenantName: table.tenant.name,
      tableId,
      tableNumber: table.number,
    };
  }

  @Public()
  @Throttle({ short: { limit: 30, ttl: 60_000 } })
  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { slug, deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        bannerUrl: true,
        primaryColor: true,
        cuisineType: true,
        currency: true,
      },
    });

    if (!tenant) throw new NotFoundException('Restaurant introuvable');

    const [menu, settings] = await Promise.all([
      this.menuService.findPublicMenu(tenant.id),
      this.prisma.restaurantSettings.findUnique({
        where: { tenantId: tenant.id },
        select: {
          description: true,
          phone: true,
          email: true,
          address: true,
          website: true,
          facebookUrl: true,
          instagramUrl: true,
          twitterUrl: true,
          youtubeUrl: true,
        },
      }),
    ]);

    return {
      tenant: { ...tenant, settings: settings ?? null },
      menu,
      // Short-lived HMAC token required to submit orders — prevents scripted flooding
      sessionToken: this.menuSession.generate(slug),
    };
  }

  @Public()
  @Throttle({ orders: { limit: 5, ttl: 60_000 * 60 } })
  @Post(':slug/order')
  createOrder(
    @Param('slug') slug: string,
    @Body() dto: PublicCreateOrderDto,
    @Headers('x-menu-session') sessionToken?: string,
  ) {
    return this.publicOrderService.createOrder(slug, dto, sessionToken);
  }

  @Public()
  @Throttle({ orders: { limit: 5, ttl: 60_000 * 60 } })
  @Post(':slug/reservation')
  async createReservation(
    @Param('slug') slug: string,
    @Body() dto: PublicCreateReservationDto,
    @Headers('x-menu-session') sessionToken?: string,
  ) {
    // Même garde-fou anti-scraping/flooding que les commandes publiques.
    if (!this.menuSession.verify(slug, sessionToken)) {
      throw new ForbiddenException(
        'Session de menu invalide ou expirée. Veuillez recharger la page.',
      );
    }

    const tenant = await this.prisma.tenant.findFirst({
      where: { slug, deletedAt: null },
      select: { id: true },
    });
    if (!tenant) throw new NotFoundException('Restaurant introuvable');

    // Un client public ne choisit jamais tableId/status directement — la
    // réservation entre toujours en 'pending', une table est assignée par
    // le staff. stripHtml empêche un XSS stocké via le nom du client.
    return this.reservationsService.create(tenant.id, {
      date: dto.date,
      time: dto.time,
      guests: dto.guests,
      customerName: stripHtml(dto.customerName),
      email: dto.email,
      phone: dto.phone,
    } as any);
  }
}
