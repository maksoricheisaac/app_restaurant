import { IsArray, IsBoolean, IsEnum } from 'class-validator';
import { Permission } from '@prisma/client';

export class UpdateRolePermissionsDto {
  @IsArray()
  @IsEnum(Permission, { each: true })
  permissions: Permission[];
}

export class SetUserPermissionDto {
  @IsEnum(Permission)
  permission: Permission;

  /** true = accorder en plus du rôle, false = retirer malgré le rôle. */
  @IsBoolean()
  granted: boolean;
}
