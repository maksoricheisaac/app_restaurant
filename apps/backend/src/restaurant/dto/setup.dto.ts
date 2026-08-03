import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsArray,
  ValidateNested,
  MinLength,
  MaxLength,
  Min,
  Max,
  ArrayMaxSize,
} from 'class-validator';
import { PaymentMethod } from '@prisma/client';

/** Étape 1 — le propriétaire. Premier et unique compte créé par l'assistant. */
export class SetupOwnerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, {
    message: 'Le mot de passe doit contenir au moins 8 caractères',
  })
  @MaxLength(128)
  password: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

/** Étape 2 — l'établissement. */
export class SetupRestaurantDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

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
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsString()
  @IsNotEmpty()
  timezone: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  primaryColor?: string;

  @IsOptional()
  @IsBoolean()
  dineInEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  takeawayEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  deliveryEnabled?: boolean;
}

/** Étape 3 — la caisse. */
export class SetupCashDto {
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

export class SetupMenuItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;
}

/** Étape 4 — la carte initiale : catégories et, optionnellement, leurs plats. */
export class SetupCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => SetupMenuItemDto)
  items?: SetupMenuItemDto[];
}

/** Étape 5 — les imprimantes. */
export class SetupPrintingDto {
  @IsOptional()
  @IsString()
  receiptPrinterName?: string;

  @IsOptional()
  @IsString()
  kitchenPrinterName?: string;

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

/**
 * Charge utile complète de l'assistant.
 *
 * Le wizard n'écrit rien étape par étape : il accumule les réponses côté
 * client et n'envoie qu'à la validation finale. Une installation interrompue
 * ne laisse donc aucune trace en base — ni compte fantôme, ni établissement
 * à moitié configuré.
 */
export class CompleteSetupDto {
  @ValidateNested()
  @Type(() => SetupOwnerDto)
  owner: SetupOwnerDto;

  @ValidateNested()
  @Type(() => SetupRestaurantDto)
  restaurant: SetupRestaurantDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SetupCashDto)
  cash?: SetupCashDto;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => SetupCategoryDto)
  menu?: SetupCategoryDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => SetupPrintingDto)
  printing?: SetupPrintingDto;
}
