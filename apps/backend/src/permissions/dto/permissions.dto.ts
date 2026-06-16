import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsArray,
  IsEnum,
  IsIn,
} from 'class-validator';
import { UserStatus } from '@prisma/client';
import { ASSIGNABLE_TENANT_ROLES } from '../../common/constants/tenant-roles.constant';

export class CreateStaffDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsIn(ASSIGNABLE_TENANT_ROLES, {
    message: `role must be one of: ${ASSIGNABLE_TENANT_ROLES.join(', ')}`,
  })
  role: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class UpdateStaffDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsIn(ASSIGNABLE_TENANT_ROLES, {
    message: `role must be one of: ${ASSIGNABLE_TENANT_ROLES.join(', ')}`,
  })
  role?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}

export class UpdateRolePermissionsDto {
  @IsArray()
  @IsString({ each: true })
  permissions: string[];
}
