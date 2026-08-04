import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsDefined,
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsArray,
  ValidateNested,
  MinLength,
  MaxLength,
  Matches,
  Min,
  Max,
  ArrayMaxSize,
} from 'class-validator';
import { PaymentMethod } from '@prisma/client';

/**
 * Exigence de robustesse du mot de passe **du compte racine**, plus stricte
 * que celle des autres comptes (8 caractères, trois classes).
 *
 * Ce compte-là ne se crée qu'une fois, sur une route publique, et ouvre tous
 * les droits sans exception ni possibilité de restriction. Le surcoût
 * d'ergonomie est payé une seule fois dans la vie du logiciel.
 */
export const ROOT_PASSWORD_MIN_LENGTH = 10;
export const ROOT_PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/;
export const ROOT_PASSWORD_MESSAGE =
  'Le mot de passe doit contenir une minuscule, une majuscule, un chiffre et un caractère spécial';

/**
 * Étape 1 — le super administrateur.
 *
 * Premier et unique compte créé par l'assistant, et seul moyen d'obtenir le
 * rôle `super_admin` : aucune invitation, aucune promotion, aucun transfert de
 * propriété ne l'accorde.
 */
export class SetupSuperAdminDto {
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
  @MinLength(ROOT_PASSWORD_MIN_LENGTH, {
    message: `Le mot de passe doit contenir au moins ${ROOT_PASSWORD_MIN_LENGTH} caractères`,
  })
  @MaxLength(128)
  @Matches(ROOT_PASSWORD_PATTERN, { message: ROOT_PASSWORD_MESSAGE })
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
  /**
   * `@IsDefined()` n'est pas redondant avec `@ValidateNested()` : ce dernier
   * ignore silencieusement une valeur absente. Sans lui, une charge utile sans
   * `superAdmin` traversait la validation et n'échouait qu'au premier accès au
   * bloc dans le service — une `TypeError` que le catch-all traduisait en 500,
   * là où le contrat de la route annonce un 400.
   */
  @IsDefined()
  @ValidateNested()
  @Type(() => SetupSuperAdminDto)
  superAdmin: SetupSuperAdminDto;

  /**
   * Obligatoire à la première installation, inutile en reprise : quand
   * l'établissement existe déjà et que seul le compte racine manque, sa
   * configuration n'est pas retouchée. `SetupService` refuse une première
   * installation sans ce bloc.
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => SetupRestaurantDto)
  restaurant?: SetupRestaurantDto;

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
