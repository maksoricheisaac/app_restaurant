import { IsOptional, IsEnum } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { OrderType } from './create-order.dto';

/**
 * Filtre de liste : tous les états d'un ticket peuvent être recherchés, y
 * compris ceux qui ne se posent pas à la main (`open`, `pending`, `paid`).
 */
export enum OrderStatusFilter {
  OPEN = 'open',
  PENDING = 'pending',
  PREPARING = 'preparing',
  READY = 'ready',
  SERVED = 'served',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

export class OrderFiltersDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(OrderStatusFilter)
  status?: OrderStatusFilter;

  @IsOptional()
  @IsEnum(OrderType)
  type?: OrderType;
}
