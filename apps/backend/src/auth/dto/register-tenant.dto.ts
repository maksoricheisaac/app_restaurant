import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';

export class RegisterTenantDto {
  @IsString()
  @IsNotEmpty({ message: 'Le nom du restaurant est requis' })
  restaurantName: string;

  @IsString()
  @IsNotEmpty({ message: 'Le slug est requis' })
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug invalide (minuscules, chiffres et tirets uniquement)',
  })
  slug: string;

  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty({ message: "L'email est requis" })
  ownerEmail: string;

  @IsString()
  @IsNotEmpty({ message: 'Le nom du propriétaire est requis' })
  ownerName: string;

  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit faire au moins 8 caractères' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre',
  })
  @IsNotEmpty({ message: 'Le mot de passe est requis' })
  password: string;
}
