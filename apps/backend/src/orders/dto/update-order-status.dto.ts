import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * Avancements que l'équipe peut demander au niveau du ticket.
 *
 * `pending`, `open` et `paid` n'y figurent pas : ils se déduisent de l'état
 * des lignes ou de l'encaissement, et ne se posent pas à la main.
 */
export enum OrderStatusTarget {
  PREPARING = 'preparing',
  READY = 'ready',
  SERVED = 'served',
  CANCELLED = 'cancelled',
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatusTarget)
  @IsNotEmpty()
  status: OrderStatusTarget;

  /** Obligatoire pour une annulation — voir `OrdersService.updateStatus`. */
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}
