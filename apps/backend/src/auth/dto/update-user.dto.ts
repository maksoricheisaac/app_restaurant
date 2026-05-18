import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class UpdateUserRoleDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(['user', 'support', 'super_admin'], { message: 'Rôle invalide' })
  platformRole: string;
}

export class UpdateUserStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(['active', 'inactive'], { message: 'Statut invalide' })
  status: string;
}
