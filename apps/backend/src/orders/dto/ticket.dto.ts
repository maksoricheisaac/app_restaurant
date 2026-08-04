import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ArrayMinSize,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderItemDto } from './create-order.dto';

export class AddOrderLinesDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Au moins un article est requis' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  /**
   * Envoyer la tournée en cuisine dans la foulée. Par défaut `false` : le
   * serveur compose d'abord, puis envoie d'un geste.
   */
  @IsOptional()
  @IsBoolean()
  sendImmediately?: boolean;
}

export class UpdateOrderLineDto {
  @IsInt()
  @Min(1, { message: 'La quantité doit être au moins de 1' })
  quantity: number;
}

export class VoidOrderLineDto {
  /**
   * Motif obligatoire : annuler une ligne déjà partie en cuisine est une
   * perte, elle doit pouvoir être expliquée après coup.
   */
  @IsString()
  @IsNotEmpty({ message: 'Un motif est obligatoire' })
  @MaxLength(255)
  reason: string;
}

export class CancelOrderDto {
  @IsString()
  @IsNotEmpty({ message: 'Un motif est obligatoire' })
  @MaxLength(255)
  reason: string;
}

/** Avancements que la cuisine peut appliquer à une ligne. */
export enum LineAdvanceTarget {
  PREPARING = 'preparing',
  READY = 'ready',
  SERVED = 'served',
}

export class AdvanceOrderLineDto {
  @IsEnum(LineAdvanceTarget)
  @IsNotEmpty()
  status: LineAdvanceTarget;
}
