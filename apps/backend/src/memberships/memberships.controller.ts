import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { InviteMemberDto, UpdateMemberRoleDto } from './dto/membership.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import type { Tenant } from '@prisma/client';

@Controller('/memberships')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Get()
  @Roles('owner', 'manager')
  findAll(@CurrentTenant() tenant: Tenant) {
    return this.membershipsService.findByTenant(tenant.id);
  }

  @Post('invite')
  @Roles('owner', 'manager')
  invite(@CurrentTenant() tenant: Tenant, @Body() body: InviteMemberDto) {
    return this.membershipsService.invite(tenant.id, body.email, body.role);
  }

  @Patch(':id/role')
  @Roles('owner')
  updateRole(
    @CurrentTenant() tenant: Tenant,
    @Param('id') id: string,
    @Body() body: UpdateMemberRoleDto,
  ) {
    return this.membershipsService.updateRole(id, tenant.id, body.role);
  }

  @Delete(':id')
  @Roles('owner')
  remove(@CurrentTenant() tenant: Tenant, @Param('id') id: string) {
    return this.membershipsService.remove(id, tenant.id);
  }
}
