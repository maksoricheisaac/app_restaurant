import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Permission } from '@prisma/client';
import { PermissionsService } from './permissions.service';
import {
  UpdateRolePermissionsDto,
  SetUserPermissionDto,
} from './dto/permissions.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  StaffRole,
  ALL_STAFF_ROLES,
} from '../common/constants/staff-roles.constant';

function parseRole(role: string): StaffRole {
  if (!(ALL_STAFF_ROLES as readonly string[]).includes(role)) {
    throw new BadRequestException(
      `Rôle inconnu. Attendu : ${ALL_STAFF_ROLES.join(', ')}`,
    );
  }
  return role as StaffRole;
}

@Controller('/permissions')
@UseGuards(AuthGuard, RolesGuard)
export class PermissionsController {
  constructor(private readonly permissions: PermissionsService) {}

  @Get('catalog')
  @Roles('owner', 'manager')
  getCatalog() {
    return this.permissions.getCatalog();
  }

  @Get('roles')
  @Roles('owner', 'manager')
  getAllRolePermissions() {
    return this.permissions.getAllRolePermissions();
  }

  @Get('roles/:role')
  @Roles('owner', 'manager')
  getRolePermissions(@Param('role') role: string) {
    return this.permissions.getRolePermissions(parseRole(role));
  }

  @Patch('roles/:role')
  @Roles('owner')
  updateRolePermissions(
    @Param('role') role: string,
    @Body() data: UpdateRolePermissionsDto,
  ) {
    return this.permissions.updateRolePermissions(parseRole(role), data);
  }

  @Post('roles/:role/reset')
  @Roles('owner')
  resetRolePermissions(@Param('role') role: string) {
    return this.permissions.resetRolePermissions(parseRole(role));
  }

  @Get('users/:userId')
  @Roles('owner', 'manager')
  getUserPermissions(@Param('userId') userId: string) {
    return this.permissions.getUserPermissions(userId);
  }

  @Patch('users/:userId')
  @Roles('owner')
  setUserPermission(
    @Param('userId') userId: string,
    @Body() data: SetUserPermissionDto,
  ) {
    return this.permissions.setUserPermission(userId, data);
  }

  @Delete('users/:userId/:permission')
  @Roles('owner')
  clearUserPermission(
    @Param('userId') userId: string,
    @Param('permission') permission: string,
  ) {
    if (!(permission in Permission)) {
      throw new BadRequestException('Permission inconnue');
    }
    return this.permissions.clearUserPermission(
      userId,
      permission as Permission,
    );
  }
}
