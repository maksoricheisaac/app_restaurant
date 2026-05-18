import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto, UpdateMessageDto } from './dto/messages.dto';

const NOT_DELETED = { deletedAt: null };

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.message.findMany({
      where: { tenantId, ...NOT_DELETED },
      orderBy: { createdAt: 'desc' },
    });
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
    return this.prisma.message.update({ where: { id }, data });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.message.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
