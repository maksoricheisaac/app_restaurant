import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { MenuSessionService } from './menu-session.service';
import { RestaurantService } from '../restaurant/restaurant.service';
import { OrderCreationService } from '../orders/order-creation.service';
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

/**
 * Prise de commande par le client depuis la carte publique.
 *
 * Adaptateur : ce service ne porte que ce qui est propre au canal public —
 * le jeton de session de menu et l'ouverture du mode de service demandé.
 * Tout le métier (prix relus en base, validation des options, zone de
 * livraison, décrément du stock, événements temps réel) vit dans
 * `OrderCreationService`, partagé avec la prise de commande au comptoir.
 */
@Injectable()
export class PublicOrderService {
  constructor(
    private readonly menuSession: MenuSessionService,
    private readonly restaurant: RestaurantService,
    private readonly orderCreation: OrderCreationService,
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

    // Le mode de service demandé doit être ouvert par le restaurant. Règle
    // propre au canal public : au comptoir, l'employé prend la commande quel
    // que soit l'état des services proposés en ligne.
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

    const order = await this.orderCreation.create({
      channel: 'public',
      type: dto.type,
      items: dto.items.map((item) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        selectedOptionIds: item.selectedOptionIds,
      })),
      tableId: dto.tableId,
      deliveryZoneId: dto.deliveryZoneId,
      deliveryAddress: dto.deliveryAddress,
      specialNotes: dto.specialNotes,
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
    });

    return { orderId: order.id, status: order.status, total: order.total };
  }
}
