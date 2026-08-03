import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  Min,
  Max,
  IsEmail,
  MaxLength,
} from 'class-validator';
import { DayOfWeek, PaymentMethod } from '@prisma/client';

/** Identité publique et coordonnées de l'établissement. */
export class UpdateRestaurantIdentityDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  slogan?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  cuisineType?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @IsOptional()
  @IsString()
  primaryColor?: string;

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
  website?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
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

/** Modes de service acceptés et garde-fous de prise de commande. */
export class UpdateServiceSettingsDto {
  @IsOptional()
  @IsBoolean()
  dineInEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  takeawayEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  deliveryEnabled?: boolean;

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

export class UpdateCashSettingsDto {
  @IsOptional()
  @IsEnum(PaymentMethod)
  defaultPaymentMethod?: PaymentMethod;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  taxRate?: number;

  @IsOptional()
  @IsBoolean()
  taxIncluded?: boolean;

  @IsOptional()
  @IsBoolean()
  requireCashSession?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultOpeningFloat?: number;
}

export class UpdatePrintingSettingsDto {
  @IsOptional()
  @IsString()
  receiptPrinterName?: string;

  @IsOptional()
  @IsString()
  kitchenPrinterName?: string;

  /** 58 mm et 80 mm couvrent la quasi-totalité des imprimantes thermiques. */
  @IsOptional()
  @IsInt()
  @Min(58)
  @Max(112)
  receiptPaperWidth?: number;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  receiptHeader?: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  receiptFooter?: string;

  @IsOptional()
  @IsBoolean()
  autoPrintReceipt?: boolean;

  @IsOptional()
  @IsBoolean()
  autoPrintKitchenTicket?: boolean;
}

export class OpeningHourDto {
  @IsEnum(DayOfWeek, {
    message:
      'dayOfWeek doit être MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY ou SUNDAY',
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
