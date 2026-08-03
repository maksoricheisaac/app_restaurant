import {
  IsEmail,
  IsNotEmpty,
  IsIn,
  IsUUID,
  IsString,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';
import { UserStatus } from '@prisma/client';
import { ASSIGNABLE_STAFF_ROLES } from '../../common/constants/staff-roles.constant';

const ROLE_MESSAGE = `Le rôle doit être l'un de : ${ASSIGNABLE_STAFF_ROLES.join(', ')}`;

export class InviteStaffDto {
  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty()
  email: string;

  @IsIn(ASSIGNABLE_STAFF_ROLES, { message: ROLE_MESSAGE })
  role: string;
}

/** Création directe d'un compte, sans passer par l'invitation par email. */
export class CreateStaffDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, {
    message: 'Le mot de passe doit contenir au moins 8 caractères',
  })
  @MaxLength(128)
  password: string;

  @IsIn(ASSIGNABLE_STAFF_ROLES, { message: ROLE_MESSAGE })
  role: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class UpdateStaffDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsIn(ASSIGNABLE_STAFF_ROLES, { message: ROLE_MESSAGE })
  role?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}

export class TransferOwnershipDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;
}
