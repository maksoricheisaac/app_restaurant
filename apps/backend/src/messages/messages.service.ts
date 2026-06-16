import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateMessageDto,
  UpdateMessageDto,
  MessageStatusValue,
} from './dto/messages.dto';
import { getSkipTake, toPaginated } from '../common/pagination/paginate';

const NOT_DELETED = { deletedAt: null };

export interface MessageFilters {
  period?: 'today' | 'week' | 'month' | 'all' | string;
  date?: string;
  status?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  private buildDateFilter(filters: MessageFilters): object {
    if (filters.date) {
      const d = new Date(filters.date);
      if (!isNaN(d.getTime())) {
        const start = new Date(d);
        start.setHours(0, 0, 0, 0);
        const end = new Date(d);
        end.setHours(23, 59, 59, 999);
        return { createdAt: { gte: start, lte: end } };
      }
    }

    const now = new Date();
    switch (filters.period) {
      case 'today': {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        return { createdAt: { gte: start } };
      }
      case 'week': {
        const start = new Date(now);
        start.setDate(now.getDate() - 7);
        return { createdAt: { gte: start } };
      }
      case 'month': {
        const start = new Date(now);
        start.setDate(now.getDate() - 30);
        return { createdAt: { gte: start } };
      }
      default:
        return {};
    }
  }

  async findAll(tenantId: string, filters: MessageFilters = {}) {
    const dateFilter = this.buildDateFilter(filters);
    const statusFilter =
      filters.status && filters.status !== 'all'
        ? { status: filters.status as any }
        : {};
    const where = { tenantId, ...NOT_DELETED, ...dateFilter, ...statusFilter };
    const { skip, take, page, limit } = getSkipTake(
      filters.page,
      filters.limit,
    );

    const [data, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.message.count({ where }),
    ]);

    return toPaginated(data, total, page, limit);
  }

  async findOne(tenantId: string, id: string) {
    const msg = await this.prisma.message.findFirst({
      where: { id, tenantId, ...NOT_DELETED },
    });
    if (!msg) throw new NotFoundException('Message not found');
    return msg;
  }

  async create(tenantId: string, data: CreateMessageDto) {
    return this.prisma.message.create({
      data: { ...data, tenantId },
    });
  }

  async update(tenantId: string, id: string, data: UpdateMessageDto) {
    await this.findOne(tenantId, id);

    // Normalize: status → read (backward-compat with frontend sending status:'read')
    const updatePayload: any = { ...data };
    if (data.status) {
      updatePayload.read = data.status !== MessageStatusValue.new;
      updatePayload.status = data.status;
    } else if (data.read !== undefined) {
      updatePayload.status = data.read
        ? MessageStatusValue.read
        : MessageStatusValue.new;
    }

    return this.prisma.message.update({ where: { id }, data: updatePayload });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.message.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
