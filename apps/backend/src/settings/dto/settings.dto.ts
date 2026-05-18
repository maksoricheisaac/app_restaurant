import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  Min,
  IsEmail,
  IsArray,
} from 'class-validator';
import { DayOfWeek } from '@prisma/client';

export class UpdateGeneralSettingsDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsBoolean()
  deliveryEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  takeawayEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  dineInEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxOrdersPerHour?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxOrdersPerUserHour?: number;
}

export class OpeningHourDto {
  @IsEnum(DayOfWeek, {
    message: 'dayOfWeek doit être MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY ou SUNDAY',
  })
  dayOfWeek: DayOfWeek;

  @IsString()
  @IsNotEmpty()
  openTime: string;

  @IsString()
  @IsNotEmpty()
  closeTime: string;

  @IsBoolean()
  isClosed: boolean;
}

export class UpdateSocialLinksDto {
  @IsOptional()
  @IsString()
  facebookUrl?: string;

  @IsOptional()
  @IsString()
  instagramUrl?: string;

  @IsOptional()
  @IsString()
  twitterUrl?: string;

  @IsOptional()
  @IsString()
  youtubeUrl?: string;
}

export class UpdateLimitsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  maxOrdersPerHour?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxOrdersPerUserHour?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxReservationGuests?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxDaysInAdvance?: number;
}

export class CreateDeliveryZoneDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrder?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  deliveryTime?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  polygon?: string;
}

export class UpdateDeliveryZoneDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrder?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  deliveryTime?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  polygon?: string;
}
