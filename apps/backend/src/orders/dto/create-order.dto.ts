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
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  // Price is accepted from internal staff (POS) but validated in service against DB
  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsUUID()
  menuItemId?: string;

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
