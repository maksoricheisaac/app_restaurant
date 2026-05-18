import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';

export enum ReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
}

export class CreateReservationDto {
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsOptional()
  time?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  guests?: number;

  @IsEnum(ReservationStatus)
  @IsOptional()
  status?: ReservationStatus = ReservationStatus.PENDING;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsOptional()
  @IsString()
  tableId?: string;
}
