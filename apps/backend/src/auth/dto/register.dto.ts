import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

/**
 * Payload UNIQUE d'inscription.
 *
 * Contrairement à l'ancien flux (compte créé dès l'étape 1 via `initiate`),
 * plus RIEN n'est écrit en base pendant l'assistant : le compte ET le
 * restaurant sont provisionnés en une seule transaction à la toute fin, à
 * partir de ce payload accumulé côté client. Tant que l'utilisateur n'a pas
 * terminé le wizard, aucune donnée (compte compris) n'existe en base.
 *
 * Le tenant est toujours créé sur le plan `free`. La souscription à un plan
 * payant se fait juste après l'inscription via le checkout `/billing/*`
 * (upgrade appliqué par webhook) — jamais en écriture directe ici.
 */
export class RegisterDto {
  // ── Compte ──────────────────────────────────────────────────────────────
  @IsString()
  @IsNotEmpty({ message: 'Le prénom est requis' })
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'Le nom est requis' })
  lastName: string;

  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty({ message: "L'email est requis" })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit faire au moins 8 caractères' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre',
  })
  @IsNotEmpty({ message: 'Le mot de passe est requis' })
  password: string;

  // ── Restaurant ──────────────────────────────────────────────────────────
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
