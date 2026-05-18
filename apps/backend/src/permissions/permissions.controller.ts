import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import {
  CreateStaffDto,
  UpdateStaffDto,
  UpdateRolePermissionsDto,
} from './dto/permissions.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import type { Tenant } from '@prisma/client';

@Controller('/permissions')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get('personnel')
  @Roles('owner', 'manager')
  getPersonnel(@CurrentTenant() tenant: Tenant) {
    return this.permissionsService.getPersonnel(tenant.id);
  }

  @Post('staff')
  @Roles('owner', 'manager')
  createStaff(@CurrentTenant() tenant: Tenant, @Body() data: CreateStaffDto) {
    return this.permissionsService.createStaff(tenant.id, data);
  }

  @Patch('staff/:id')
  @Roles('owner', 'manager')
  updateStaff(
    @CurrentTenant() tenant: Tenant,
    @Param('id') id: string,
    @Body() data: UpdateStaffDto,
  ) {
    return this.permissionsService.updateStaff(tenant.id, id, data);
  }

  @Delete('staff/:id')
  @Roles('owner')
  deleteStaff(@CurrentTenant() tenant: Tenant, @Param('id') id: string) {
    return this.permissionsService.deleteStaff(tenant.id, id);
  }

  @Get('roles/:role')
  @Roles('owner', 'manager')
  getRolePermissions(
    @CurrentTenant() tenant: Tenant,
    @Param('role') role: string,
  ) {
    return this.permissionsService.getRolePermissions(tenant.id, role);
  }

  @Patch('roles/:role')
  @Roles('owner')
  updateRolePermissions(
    @CurrentTenant() tenant: Tenant,
    @Param('role') role: string,
    @Body() data: UpdateRolePermissionsDto,
  ) {
    return this.permissionsService.updateRolePermissions(tenant.id, role, data);
  }
}
