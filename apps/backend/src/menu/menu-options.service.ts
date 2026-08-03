import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateOptionGroupDto,
  UpdateOptionGroupDto,
  CreateOptionDto,
  UpdateOptionDto,
} from './dto/menu-option.dto';

/**
 * CRUD des groupes d'options et des options d'un plat.
 *
 * Chaque mutation vérifie d'abord que le plat / groupe / option visé existe
 * et n'est pas supprimé, pour renvoyer une 404 explicite plutôt qu'une
 * erreur Prisma opaque.
 */
@Injectable()
export class MenuOptionsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Lecture (éditeur admin) ────────────────────────────────────────────────
  async listForItem(menuItemId: string) {
    await this.assertItem(menuItemId);
    return this.prisma.menuItemOptionGroup.findMany({
      where: { menuItemId, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        options: {
          where: { deletedAt: null },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
      },
    });
  }

  // ── Groupes ────────────────────────────────────────────────────────────────
  async createGroup(dto: CreateOptionGroupDto) {
    await this.assertItem(dto.menuItemId);
    this.assertMinMax(dto.minSelect, dto.maxSelect);
    return this.prisma.menuItemOptionGroup.create({
      data: {
        menuItemId: dto.menuItemId,
        name: dto.name,
        required: dto.required ?? false,
        minSelect: dto.minSelect ?? 0,
        maxSelect: dto.maxSelect ?? 1,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async updateGroup(id: string, dto: UpdateOptionGroupDto) {
    await this.assertGroup(id);
    this.assertMinMax(dto.minSelect, dto.maxSelect);
    return this.prisma.menuItemOptionGroup.update({
      where: { id },
      data: {
        name: dto.name,
        required: dto.required,
        minSelect: dto.minSelect,
        maxSelect: dto.maxSelect,
        sortOrder: dto.sortOrder,
      },
    });
  }

  async removeGroup(id: string) {
    await this.assertGroup(id);
    // Soft delete du groupe ET de ses options (préserve les commandes historiques).
    await this.prisma.$transaction([
      this.prisma.menuItemOption.updateMany({
        where: { groupId: id, deletedAt: null },
        data: { deletedAt: new Date() },
      }),
      this.prisma.menuItemOptionGroup.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
    ]);
    return { success: true };
  }

  // ── Options ──────────────────────────────────────────────────────────────
  async createOption(dto: CreateOptionDto) {
    await this.assertGroup(dto.groupId);
    return this.prisma.menuItemOption.create({
      data: {
        groupId: dto.groupId,
        name: dto.name,
        priceDelta: dto.priceDelta ?? 0,
        available: dto.available ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async updateOption(id: string, dto: UpdateOptionDto) {
    await this.assertOption(id);
    return this.prisma.menuItemOption.update({
      where: { id },
      data: {
        name: dto.name,
        priceDelta: dto.priceDelta,
        available: dto.available,
        sortOrder: dto.sortOrder,
      },
    });
  }

  async removeOption(id: string) {
    await this.assertOption(id);
    await this.prisma.menuItemOption.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { success: true };
  }

  // ── Garde-fous d'existence ─────────────────────────────────────────────────
  private async assertItem(menuItemId: string) {
    const item = await this.prisma.menuItem.findFirst({
      where: { id: menuItemId, deletedAt: null },
      select: { id: true },
    });
    if (!item) throw new NotFoundException('Plat introuvable');
  }

  private async assertGroup(groupId: string) {
    const group = await this.prisma.menuItemOptionGroup.findFirst({
      where: { id: groupId, deletedAt: null },
      select: { id: true },
    });
    if (!group) throw new NotFoundException("Groupe d'options introuvable");
  }

  private async assertOption(optionId: string) {
    const option = await this.prisma.menuItemOption.findFirst({
      where: { id: optionId, deletedAt: null },
      select: { id: true },
    });
    if (!option) throw new NotFoundException('Option introuvable');
  }

  private assertMinMax(minSelect?: number, maxSelect?: number) {
    if (
      minSelect != null &&
      maxSelect != null &&
      maxSelect > 0 &&
      minSelect > maxSelect
    ) {
      throw new BadRequestException('minSelect ne peut pas dépasser maxSelect');
    }
  }
}
