import { IsString, IsNotEmpty, Matches, IsOptional } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty({ message: 'Le nom est requis' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Le slug est requis' })
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug invalide (minuscules, chiffres et tirets uniquement)',
  })
  slug: string;

  // La clé du plan est validée dynamiquement contre la table Plan (data-driven),
  // et non plus contre une enum figée.
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'Clé de plan invalide' })
  plan?: string;
}
