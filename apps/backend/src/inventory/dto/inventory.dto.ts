import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum StockMovementType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUST = 'ADJUST',
}

export class CreateIngredientDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number = 0;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minStock?: number;

  @IsOptional()
  @IsString()
  supplier?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export class CreateStockMovementDto {
  @IsString()
  @IsNotEmpty()
  ingredientId: string;

  @IsEnum(StockMovementType)
  type: StockMovementType;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  orderId?: string;
}

export class MovementFiltersDto {
  @IsOptional()
  @IsString()
  ingredientId?: string;

  @IsOptional()
  @IsEnum(StockMovementType)
  type?: StockMovementType;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}

export class CreateRecipeDto {
  @IsString()
  @IsNotEmpty()
  menuItemId: string;

  @IsString()
  @IsNotEmpty()
  ingredientId: string;

  @IsNumber()
  @Min(0)
  quantity: number;
}

export class UpdateRecipeDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;
}
