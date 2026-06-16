import { IsOptional, IsEnum, IsDateString, IsString } from 'class-validator';
import { PageQueryDto } from '../../common/dto/page-query.dto';

export enum TransactionType {
  SALE = 'sale',
  REFUND = 'refund',
  ADJUSTMENT = 'adjustment',
}

export class TransactionFiltersDto extends PageQueryDto {
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
