import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsNumber,
  Min,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum OrderType {
  DINE_IN = 'dine_in',
  TAKEAWAY = 'takeaway',
  DELIVERY = 'delivery',
}

export class OrderItemDto {
  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsUUID()
  menuItemId?: string;

  /**
   * Options et suppléments retenus, tous groupes confondus. Le service
   * revalide `required`/`minSelect`/`maxSelect` et relit chaque `priceDelta`
   * en base — la sélection du poste de caisse n'est pas crue sur parole.
   */
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  selectedOptionIds?: string[];

  /**
   * Libellé d'un article hors carte. Ignoré dès que `menuItemId` est fourni :
   * le nom faisant foi est alors celui de la carte.
   */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  /**
   * Prix d'un article hors carte. Ignoré dès que `menuItemId` est fourni :
   * le prix est alors systématiquement relu en base.
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  image?: string;
}

export class CreateOrderDto {
  @IsEnum(OrderType)
  type: OrderType;

  @IsOptional()
  @IsUUID()
  tableId?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Au moins un article est requis' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsOptional()
  @IsString()
  specialNotes?: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  // Customer identity for auto-upsert (used when customerId is not known yet)
  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerEmail?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsOptional()
  @IsString()
  deliveryZoneId?: string;

  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  deliveryFee?: number;
}
