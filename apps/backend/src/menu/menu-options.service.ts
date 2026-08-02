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
 * CRUD des groupes d'options et options d'un plat, strictement scoping tenant :
 * chaque mutation vérifie que le plat / groupe / option appartient bien au
 * tenant courant avant d'agir (défense en profondeur multi-tenant).
 */
@Injectable()
export class MenuOptionsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Lecture (éditeur admin) ────────────────────────────────────────────────
  async listForItem(tenantId: string, menuItemId: string) {
    await this.assertItem(tenantId, menuItemId);
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
  async createGroup(tenantId: string, dto: CreateOptionGroupDto) {
    await this.assertItem(tenantId, dto.menuItemId);
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

  async updateGroup(tenantId: string, id: string, dto: UpdateOptionGroupDto) {
    await this.assertGroup(tenantId, id);
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

  async removeGroup(tenantId: string, id: string) {
    await this.assertGroup(tenantId, id);
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
  async createOption(tenantId: string, dto: CreateOptionDto) {
    await this.assertGroup(tenantId, dto.groupId);
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

  async updateOption(tenantId: string, id: string, dto: UpdateOptionDto) {
    await this.assertOption(tenantId, id);
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

  async removeOption(tenantId: string, id: string) {
    await this.assertOption(tenantId, id);
    await this.prisma.menuItemOption.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { success: true };
  }

  // ── Garde-fous multi-tenant ────────────────────────────────────────────────
  private async assertItem(tenantId: string, menuItemId: string) {
    const item = await this.prisma.menuItem.findFirst({
      where: { id: menuItemId, tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!item) throw new NotFoundException('Plat introuvable');
  }

  private async assertGroup(tenantId: string, groupId: string) {
    const group = await this.prisma.menuItemOptionGroup.findFirst({
      where: { id: groupId, deletedAt: null, menuItem: { tenantId } },
      select: { id: true },
    });
    if (!group) throw new NotFoundException("Groupe d'options introuvable");
  }

  private async assertOption(tenantId: string, optionId: string) {
    const option = await this.prisma.menuItemOption.findFirst({
      where: {
        id: optionId,
        deletedAt: null,
        group: { menuItem: { tenantId } },
      },
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
      throw new BadRequestException(
        'minSelect ne peut pas dépasser maxSelect',
      );
    }
  }
}
