import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class RestaurantInfoDto {
  @IsString()
  @IsNotEmpty({ message: 'Le nom du restaurant est requis' })
  restaurantName: string;

  @IsString()
  @IsNotEmpty({ message: 'Le slug est requis' })
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug invalide (minuscules, chiffres et tirets uniquement)',
  })
  slug: string;

  @IsString()
  @IsNotEmpty({ message: 'Le pays est requis' })
  country: string;

  @IsString()
  @IsNotEmpty({ message: 'La devise est requise' })
  currency: string;

  @IsString()
  @IsNotEmpty({ message: 'Le fuseau horaire est requis' })
  timezone: string;

  @IsString()
  @IsOptional()
  cuisineType?: string;
}
