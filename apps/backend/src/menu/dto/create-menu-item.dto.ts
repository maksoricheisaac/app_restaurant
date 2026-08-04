import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Max,
  Min,
  IsBoolean,
} from 'class-validator';

export class CreateMenuItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  /**
   * Taux de TVA de l'article, en pourcentage. Absent = taux par défaut de
   * l'établissement. Un 0 explicite vaut exonération et n'est pas remplacé
   * par le taux par défaut.
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  taxRate?: number | null;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsBoolean()
  available?: boolean = true;

  @IsString()
  @IsNotEmpty()
  categoryId: string;
}
