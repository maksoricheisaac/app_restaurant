import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';

const NOT_DELETED = { deletedAt: null };

@Injectable()
export class TablesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.table.findMany({
      where: NOT_DELETED,
      include: { _count: { select: { orders: true, reservations: true } } },
      orderBy: { number: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.table.findFirst({ where: { id, ...NOT_DELETED } });
  }

  async create(data: CreateTableDto) {
    // Pré-contrôle pour un message clair ; l'unicité réelle est garantie par
    // l'index unique partiel sur (number) WHERE "deletedAt" IS NULL.
    const existing = await this.prisma.table.findFirst({
      where: { number: data.number, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException(`La table numéro ${data.number} existe déjà`);
    }
    return this.prisma.table.create({ data });
  }

  async update(id: string, data: UpdateTableDto) {
    if (data.number !== undefined) {
      const conflict = await this.prisma.table.findFirst({
        where: { number: data.number, deletedAt: null, NOT: { id } },
      });
      if (conflict) {
        throw new ConflictException(
          `La table numéro ${data.number} existe déjà`,
        );
      }
    }
    return this.prisma.table.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.table.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findLocations() {
    const tables = await this.prisma.table.findMany({
      where: { location: { not: null }, ...NOT_DELETED },
      select: { location: true },
      distinct: ['location'],
    });
    return tables.map((t) => t.location).filter(Boolean);
  }
}
