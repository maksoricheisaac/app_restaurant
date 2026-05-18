import { IsEmail, IsString, IsNotEmpty, IsEnum } from 'class-validator';

export class InviteMemberDto {
  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  role: string;
}

export class UpdateMemberRoleDto {
  @IsString()
  @IsNotEmpty()
  role: string;
}
