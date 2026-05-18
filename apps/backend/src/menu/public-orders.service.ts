import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../gateway/events.service';
import { PlanLimitService } from '../plans/plans.service';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PublicOrderItemDto {
  @IsString() @IsUUID() menuItemId: string;
  @IsNumber() @Min(1) @Max(99) quantity: number;
}

export class PublicCreateOrderDto {
  @IsEnum(['dine_in', 'takeaway', 'delivery']) type: 'dine_in' | 'takeaway' | 'delivery';
  @IsArray() @ValidateNested({ each: true }) @Type(() => PublicOrderItemDto) items: PublicOrderItemDto[];
  @IsOptional() @IsUUID() tableId?: string;
  @IsOptional() @IsString() @MaxLength(500) specialNotes?: string;
  @IsOptional() @IsString() @MaxLength(100) customerName?: string;
  @IsOptional() @IsString() @MaxLength(20) customerPhone?: string;
}

export interface PublicOrderResult {
  orderId: string;
  status: string;
  total: unknown;
}

@Injectable()
export class PublicOrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
    private readonly planLimitService: PlanLimitService,
  ) {}

  async createOrder(slug: string, dto: PublicCreateOrderDto): Promise<PublicOrderResult> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, name: true },
    });

    if (!tenant) throw new NotFoundException('Restaurant introuvable');

    // Enforce monthly order quota before accepting any public order.
    await this.planLimitService.assertMonthlyOrderLimit(tenant.id);

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('La commande doit contenir au moins un article');
    }

    // Re-fetch prices from DB — never trust any client-supplied price values.
    const menuItemIds = dto.items.map((i) => i.menuItemId);
    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, tenantId: tenant.id, available: true },
      select: { id: true, name: true, price: true, image: true },
    });

    if (menuItems.length !== menuItemIds.length) {
      throw new BadRequestException('Un ou plusieurs articles sont indisponibles');
    }

    const menuItemMap = new Map(menuItems.map((m) => [m.id, m]));
    let total = 0;
    const orderItemsData = dto.items.map((item) => {
      const menuItem = menuItemMap.get(item.menuItemId)!;
      total += Number(menuItem.price) * item.quantity;
      return {
        menuItemId: menuItem.id,
        name: menuItem.name,
        quantity: item.quantity,
        price: menuItem.price,
        image: menuItem.image,
      };
    });

    const order = await this.prisma.order.create({
      data: {
        tenantId: tenant.id,
        type: dto.type,
        status: 'pending',
        total,
        specialNotes: dto.specialNotes,
        tableId: dto.tableId ?? null,
        orderItems: { create: orderItemsData },
      },
      include: { orderItems: true, table: true },
    });

    this.eventsService.emitToTenant(tenant.id, 'new-order', order);

    return { orderId: order.id, status: order.status, total: order.total };
  }
}
