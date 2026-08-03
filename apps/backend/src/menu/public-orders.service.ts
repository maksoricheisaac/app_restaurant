import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../gateway/events.service';
import { MenuSessionService } from './menu-session.service';
import { RestaurantService } from '../restaurant/restaurant.service';
import { InventoryService } from '../inventory/inventory.service';
import { CustomersService } from '../customers/customers.service';
import { stripHtml } from '../common/utils/sanitize';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PublicOrderItemDto {
  @IsString() @IsUUID() menuItemId: string;
  @IsNumber() @Min(1) @Max(99) quantity: number;
  // IDs des options choisies (tous groupes confondus). Validés + revalorisés serveur.
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  selectedOptionIds?: string[];
}

export class PublicCreateOrderDto {
  @IsEnum(['dine_in', 'takeaway', 'delivery']) type:
    | 'dine_in'
    | 'takeaway'
    | 'delivery';
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PublicOrderItemDto)
  items: PublicOrderItemDto[];
  @IsOptional() @IsUUID() tableId?: string;
  @IsOptional() @IsUUID() deliveryZoneId?: string;
  @IsOptional() @IsString() @MaxLength(255) deliveryAddress?: string;
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
    private readonly menuSession: MenuSessionService,
    private readonly restaurant: RestaurantService,
    private readonly inventoryService: InventoryService,
    private readonly customersService: CustomersService,
  ) {}

  async createOrder(
    dto: PublicCreateOrderDto,
    sessionToken?: string,
  ): Promise<PublicOrderResult> {
    // Le jeton de session de menu écarte les envois scriptés directs
    if (!this.menuSession.verify(sessionToken)) {
      throw new ForbiddenException(
        'Session de menu invalide ou expirée. Veuillez recharger la page.',
      );
    }

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException(
        'La commande doit contenir au moins un article',
      );
    }

    // Le mode de service demandé doit être ouvert par le restaurant.
    const restaurant = await this.restaurant.getPublicProfile();
    const serviceEnabled: Record<PublicCreateOrderDto['type'], boolean> = {
      dine_in: restaurant.dineInEnabled,
      takeaway: restaurant.takeawayEnabled,
      delivery: restaurant.deliveryEnabled,
    };
    if (!serviceEnabled[dto.type]) {
      throw new BadRequestException(
        "Ce mode de service n'est pas disponible actuellement",
      );
    }

    const menuItemIds = dto.items.map((i) => i.menuItemId);
    const menuItems = await this.prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        available: true,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        price: true,
        image: true,
        optionGroups: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            required: true,
            minSelect: true,
            maxSelect: true,
            options: {
              where: { available: true, deletedAt: null },
              select: { id: true, name: true, priceDelta: true },
            },
          },
        },
      },
    });

    if (menuItems.length !== menuItemIds.length) {
      throw new BadRequestException(
        'Un ou plusieurs articles sont indisponibles',
      );
    }

    const menuItemMap = new Map(menuItems.map((m) => [m.id, m]));
    let itemsSubtotal = 0;
    const orderItemsData = dto.items.map((item) => {
      const menuItem = menuItemMap.get(item.menuItemId)!;
      const selectedIds = new Set(item.selectedOptionIds ?? []);

      // Validation par groupe (required / min / max) + résolution des prix serveur.
      const optionSnapshot: {
        groupName: string;
        optionName: string;
        priceDelta: number;
      }[] = [];
      let optionsDelta = 0;
      const validOptionIds = new Set<string>();

      for (const group of menuItem.optionGroups ?? []) {
        const chosen = group.options.filter((o) => selectedIds.has(o.id));
        chosen.forEach((o) => validOptionIds.add(o.id));

        const min = group.required
          ? Math.max(1, group.minSelect)
          : group.minSelect;
        if (chosen.length < min) {
          throw new BadRequestException(
            `« ${menuItem.name} » : veuillez choisir au moins ${min} option(s) pour « ${group.name} »`,
          );
        }
        if (group.maxSelect > 0 && chosen.length > group.maxSelect) {
          throw new BadRequestException(
            `« ${menuItem.name} » : au plus ${group.maxSelect} option(s) pour « ${group.name} »`,
          );
        }

        for (const opt of chosen) {
          optionsDelta += Number(opt.priceDelta);
          optionSnapshot.push({
            groupName: group.name,
            optionName: opt.name,
            priceDelta: Number(opt.priceDelta),
          });
        }
      }

      // Rejette tout ID d'option inconnu / indisponible / d'un autre plat.
      for (const id of selectedIds) {
        if (!validOptionIds.has(id)) {
          throw new BadRequestException(
            `« ${menuItem.name} » : option sélectionnée invalide`,
          );
        }
      }

      const unitPrice = Number(menuItem.price) + optionsDelta;
      itemsSubtotal += unitPrice * item.quantity;
      return {
        menuItemId: menuItem.id,
        name: menuItem.name,
        quantity: item.quantity,
        price: unitPrice, // snapshot prix unitaire (plat + options)
        image: menuItem.image,
        options: optionSnapshot.length > 0 ? optionSnapshot : undefined,
      };
    });

    // ── Livraison : zone + frais + minimum de commande ────────────────────────
    let deliveryFee = 0;
    let resolvedDeliveryZoneId: string | null = null;
    let resolvedDeliveryAddress: string | null = null;
    if (dto.type === 'delivery') {
      if (!dto.deliveryZoneId) {
        throw new BadRequestException('Veuillez choisir une zone de livraison');
      }
      const zone = await this.prisma.deliveryZone.findFirst({
        where: { id: dto.deliveryZoneId, isActive: true, deletedAt: null },
        select: { id: true, price: true, minOrder: true },
      });
      if (!zone) {
        throw new BadRequestException('Zone de livraison introuvable');
      }
      if (zone.minOrder != null && itemsSubtotal < Number(zone.minOrder)) {
        throw new BadRequestException(
          `Le minimum de commande pour cette zone est de ${Number(zone.minOrder)}`,
        );
      }
      deliveryFee = Number(zone.price);
      resolvedDeliveryZoneId = zone.id;
      resolvedDeliveryAddress = stripHtml(dto.deliveryAddress) || null;
    }

    const total = itemsSubtotal + deliveryFee;

    // Nettoyage des champs libres : empêche un XSS stocké côté administration
    const sanitizedNotes = stripHtml(dto.specialNotes);
    const sanitizedCustomerName = stripHtml(dto.customerName) || undefined;
    const sanitizedCustomerPhone = stripHtml(dto.customerPhone) || undefined;

    // Rattache ou crée la fiche client à partir du nom/téléphone fournis
    // (à emporter / livraison) — même logique qu'à la caisse. Hors
    // transaction, pour ne pas allonger la transaction principale.
    const resolvedCustomerId =
      sanitizedCustomerName || sanitizedCustomerPhone
        ? await this.customersService.upsertFromInteraction({
            name: sanitizedCustomerName,
            phone: sanitizedCustomerPhone,
          })
        : null;

    const { order, lowStockWarnings } = await this.prisma.$transaction(
      async (tx) => {
        // Le tableId vient du QR code : il doit désigner une table existante
        // et non supprimée.
        if (dto.tableId) {
          const table = await tx.table.findFirst({
            where: { id: dto.tableId, deletedAt: null },
            select: { id: true },
          });
          if (!table) {
            throw new BadRequestException('Table introuvable');
          }
        }

        const createdOrder = await tx.order.create({
          data: {
            type: dto.type,
            status: 'pending',
            total,
            specialNotes: sanitizedNotes,
            tableId: dto.type === 'dine_in' ? (dto.tableId ?? null) : null,
            customerId: resolvedCustomerId,
            deliveryZoneId: resolvedDeliveryZoneId,
            deliveryAddress: resolvedDeliveryAddress,
            deliveryFee: dto.type === 'delivery' ? deliveryFee : null,
            orderItems: { create: orderItemsData },
          },
          include: { orderItems: true, table: true },
        });

        const warnings = await this.inventoryService.decrementStockForOrder(
          tx,
          createdOrder.id,
          orderItemsData.map((i) => ({
            menuItemId: i.menuItemId,
            quantity: i.quantity,
          })),
        );

        return { order: createdOrder, lowStockWarnings: warnings };
      },
    );

    this.eventsService.emitToStaff('new-order', order);
    for (const warning of lowStockWarnings) {
      this.eventsService.emitToStaff('low-stock-alert', warning);
    }

    return { orderId: order.id, status: order.status, total: order.total };
  }
}
