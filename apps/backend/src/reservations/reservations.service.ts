import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';

@Injectable()
export class ReservationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string | undefined, filters: any) {
    if (!tenantId) throw new ForbiddenException('Tenant context required');
    const { date, status } = filters;
    return this.prisma.reservation.findMany({
      where: {
        tenantId,
        ...(date ? { date: new Date(date) } : {}),
        ...(status ? { status } : {}),
      },
      include: { table: true, user: { select: { name: true, email: true, phone: true } } },
      orderBy: { date: 'asc' },
    });
  }

  async create(tenantId: string, data: CreateReservationDto, userId?: string) {
    return this.prisma.reservation.create({
      data: {
        ...data,
        tenantId,
        userId,
        date: new Date(data.date),
      },
    });
  }

  async updateStatus(
    tenantId: string | undefined,
    id: string,
    dto: UpdateReservationStatusDto,
  ) {
    if (!tenantId) throw new ForbiddenException('Tenant context required');
    return this.prisma.reservation.update({
      where: { id, tenantId },
      data: { status: dto.status },
    });
  }

  async remove(tenantId: string | undefined, id: string) {
    if (!tenantId) throw new ForbiddenException('Tenant context required');
    return this.prisma.reservation.delete({
      where: { id, tenantId },
    });
  }
}
