import {
  IsString,
  IsNotEmpty,
  Matches,
  IsEnum,
  IsOptional,
} from 'class-validator';

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

  @IsOptional()
  @IsEnum(['free', 'pro', 'enterprise'])
  plan?: string;
}
