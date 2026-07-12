import {
  IsString,
  IsNotEmpty,
  Matches,
  IsOptional,
  IsInt,
  Min,
  IsBoolean,
  IsObject,
  IsArray,
  MaxLength,
} from 'class-validator';

export class CreatePlanDto {
  @IsString()
  @IsNotEmpty({ message: 'La clé est requise' })
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Clé invalide (minuscules, chiffres et tirets uniquement)',
  })
  @MaxLength(40)
  key: string;

  @IsString()
  @IsNotEmpty({ message: 'Le nom est requis' })
  @MaxLength(60)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  tagline?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  monthlyPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  annualPrice?: number;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  // Limites : -1 = illimité.
  @IsOptional()
  @IsInt()
  @Min(-1)
  maxMenuItems?: number;

  @IsOptional()
  @IsInt()
  @Min(-1)
  maxTables?: number;

  @IsOptional()
  @IsInt()
  @Min(-1)
  maxStaffMembers?: number;

  @IsOptional()
  @IsInt()
  @Min(-1)
  maxMonthlyOrders?: number;

  @IsOptional()
  @IsObject()
  features?: Record<string, boolean>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  highlights?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(40)
  badge?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
