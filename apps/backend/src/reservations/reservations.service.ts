import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RESTAURANT_ID } from '../restaurant/restaurant.constants';
import { CustomersService } from '../customers/customers.service';
import { MailService } from '../mail/mail.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';

// Transitions d'état autorisées pour les réservations
const VALID_RESERVATION_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['cancelled'],
  cancelled: [], // état terminal
};

@Injectable()
export class ReservationsService {
  constructor(
    private prisma: PrismaService,
    private customersService: CustomersService,
    private mailService: MailService,
  ) {}

  async findAll(filters: any) {
    const { date, status } = filters;
    return this.prisma.reservation.findMany({
      where: {
        deletedAt: null, // exclure les soft-deleted
        ...(date ? { date: new Date(date) } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        table: true,
        user: { select: { name: true, email: true, phone: true } },
      },
      orderBy: { date: 'asc' },
    });
  }

  async create(data: CreateReservationDto, userId?: string) {
    const reservation = await this.prisma.$transaction(async (tx) => {
      // Protection contre les doubles réservations sur la même table au même créneau
      if (data.tableId && data.date && data.time) {
        const conflict = await tx.reservation.findFirst({
          where: {
            tableId: data.tableId,
            date: new Date(data.date),
            time: data.time,
            status: { not: 'cancelled' },
          },
          select: { id: true },
        });

        if (conflict) {
          throw new ConflictException(
            'Cette table est déjà réservée pour ce créneau. Choisissez un autre horaire ou une autre table.',
          );
        }
      }

      // Rattache ou crée la fiche client depuis les coordonnées saisies
      if (data.customerName || data.email || data.phone) {
        await this.customersService.upsertFromInteraction({
          name: data.customerName ?? undefined,
          email: data.email ?? undefined,
          phone: data.phone ?? undefined,
        });
      }

      return tx.reservation.create({
        data: {
          ...data,
          userId,
          date: new Date(data.date),
        },
      });
    });

    // Best-effort, hors transaction : l'échec de l'email ne doit jamais
    // faire échouer la réservation elle-même.
    if (data.email) {
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id: RESTAURANT_ID },
        select: { name: true },
      });
      void this.mailService.sendReservationConfirmation({
        to: data.email,
        restaurantName: restaurant?.name ?? 'Le restaurant',
        customerName: data.customerName,
        date: reservation.date.toISOString(),
        time: data.time,
        guests: data.guests,
      });
    }

    return reservation;
  }

  async updateStatus(id: string, dto: UpdateReservationStatusDto) {
    // Lire l'état actuel pour valider la transition
    const current = await this.prisma.reservation.findFirst({
      where: { id, deletedAt: null },
      select: { status: true },
    });

    if (!current) throw new NotFoundException('Réservation introuvable');

    const allowed = VALID_RESERVATION_TRANSITIONS[current.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Transition invalide : ${current.status} → ${dto.status}. Transitions autorisées : ${allowed.join(', ') || 'aucune'}.`,
      );
    }

    return this.prisma.reservation.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  async remove(id: string) {
    return this.prisma.reservation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
