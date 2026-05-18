import { IsOptional, IsEnum, IsDateString, IsString } from 'class-validator';

export enum TransactionType {
  SALE = 'sale',
  REFUND = 'refund',
  ADJUSTMENT = 'adjustment',
}

export class TransactionFiltersDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @IsOptional()
  @IsString()
  cashierId?: string;
}
