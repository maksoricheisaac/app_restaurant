import { Controller, Get, Post, Param, Body, NotFoundException } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';
import { MenuService } from './menu.service';
import { PrismaService } from '../prisma/prisma.service';
import { PublicOrderService, PublicCreateOrderDto } from './public-orders.service';

@Controller('/public-menu')
export class PublicMenuController {
  constructor(
    private readonly menuService: MenuService,
    private readonly prisma: PrismaService,
    private readonly publicOrderService: PublicOrderService,
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
  @Throttle({ short: { limit: 60, ttl: 60_000 } })
  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true, logo: true },
    });

    if (!tenant) throw new NotFoundException('Restaurant introuvable');

    const menu = await this.menuService.findPublicMenu(tenant.id);
    return { tenant, menu };
  }

  @Public()
  @Post(':slug/order')
  createOrder(@Param('slug') slug: string, @Body() dto: PublicCreateOrderDto) {
    return this.publicOrderService.createOrder(slug, dto);
  }
}
