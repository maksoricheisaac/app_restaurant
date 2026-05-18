import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  Min,
} from 'class-validator';

export enum TableStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  RESERVED = 'reserved',
}

export class CreateTableDto {
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  number: number;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  seats: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(TableStatus)
  status?: TableStatus;
}
