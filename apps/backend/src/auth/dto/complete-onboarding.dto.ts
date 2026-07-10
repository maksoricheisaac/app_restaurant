import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

/**
 * Payload complet de finalisation de l'onboarding.
 *
 * Toutes les données du wizard (accumulées côté client) sont envoyées en une
 * seule fois à `POST /onboarding/complete`. La base n'est alimentée qu'ici,
 * dans une transaction unique — jamais étape par étape.
 */
export class CompleteOnboardingDto {
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

  @IsIn(['free', 'pro', 'enterprise'], { message: 'Plan invalide' })
  @IsNotEmpty({ message: 'Le plan est requis' })
  plan: string;
}
