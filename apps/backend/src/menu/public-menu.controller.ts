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
import { RestaurantService } from '../restaurant/restaurant.service';
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

/**
 * Carte publique et prise de commande client.
 *
 * Il n'y a plus de slug dans les URL : ces routes servent l'unique
 * établissement, comme le site vitrine qui les consomme.
 */
@Controller('/public-menu')
export class PublicMenuController {
  constructor(
    private readonly menuService: MenuService,
    private readonly prisma: PrismaService,
    private readonly restaurant: RestaurantService,
    private readonly publicOrderService: PublicOrderService,
    private readonly menuSession: MenuSessionService,
    private readonly reservationsService: ReservationsService,
  ) {}

  /** Résolution d'un QR code de table vers le numéro de table affiché. */
  @Public()
  @Throttle({ short: { limit: 60, ttl: 60_000 } })
  @Get('by-table/:tableId')
  async findByTableId(@Param('tableId') tableId: string) {
    const table = await this.prisma.table.findFirst({
      where: { id: tableId, deletedAt: null },
      select: { id: true, number: true },
    });
    if (!table) throw new NotFoundException('Table introuvable');

    return { tableId: table.id, tableNumber: table.number };
  }

  @Public()
  @Throttle({ short: { limit: 30, ttl: 60_000 } })
  @Get()
  async findPublicMenu() {
    const [restaurant, menu, deliveryZones] = await Promise.all([
      this.restaurant.getPublicProfile(),
      this.menuService.findPublicMenu(),
      this.prisma.deliveryZone.findMany({
        where: { isActive: true, deletedAt: null },
        orderBy: { price: 'asc' },
        select: {
          id: true,
          name: true,
          price: true,
          minOrder: true,
          deliveryTime: true,
        },
      }),
    ]);

    const services = {
      dineIn: restaurant.dineInEnabled,
      takeaway: restaurant.takeawayEnabled,
      delivery: restaurant.deliveryEnabled,
    };

    return {
      restaurant,
      menu,
      services,
      deliveryZones: services.delivery ? deliveryZones : [],
      limits: {
        maxReservationGuests: restaurant.maxReservationGuests,
        maxDaysInAdvance: restaurant.maxDaysInAdvance,
      },
      // Jeton HMAC de courte durée exigé pour commander — coupe les envois
      // scriptés qui n'ont jamais chargé la carte.
      sessionToken: this.menuSession.generate(),
    };
  }

  @Public()
  @Throttle({ orders: { limit: 5, ttl: 60_000 * 60 } })
  @Post('order')
  createOrder(
    @Body() dto: PublicCreateOrderDto,
    @Headers('x-menu-session') sessionToken?: string,
  ) {
    return this.publicOrderService.createOrder(dto, sessionToken);
  }

  @Public()
  @Throttle({ orders: { limit: 5, ttl: 60_000 * 60 } })
  @Post('reservation')
  async createReservation(
    @Body() dto: PublicCreateReservationDto,
    @Headers('x-menu-session') sessionToken?: string,
  ) {
    // Même garde-fou anti-flooding que les commandes publiques.
    if (!this.menuSession.verify(sessionToken)) {
      throw new ForbiddenException(
        'Session de menu invalide ou expirée. Veuillez recharger la page.',
      );
    }

    // Un client public ne choisit jamais tableId/status directement — la
    // réservation entre toujours en 'pending', une table est assignée par
    // l'équipe. stripHtml empêche un XSS stocké via le nom du client.
    return this.reservationsService.create({
      date: dto.date,
      time: dto.time,
      guests: dto.guests,
      customerName: stripHtml(dto.customerName),
      email: dto.email,
      phone: dto.phone,
    } as any);
  }
}
