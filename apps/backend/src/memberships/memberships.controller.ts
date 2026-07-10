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
import {
  InviteMemberDto,
  UpdateMemberRoleDto,
  TransferOwnershipDto,
} from './dto/membership.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
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
  invite(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: { id: string },
    @Body() body: InviteMemberDto,
  ) {
    return this.membershipsService.invite(
      tenant.id,
      user.id,
      body.email,
      body.role,
    );
  }

  @Get('invites')
  @Roles('owner', 'manager')
  listInvites(@CurrentTenant() tenant: Tenant) {
    return this.membershipsService.listInvites(tenant.id);
  }

  @Delete('invites/:id')
  @Roles('owner', 'manager')
  revokeInvite(@CurrentTenant() tenant: Tenant, @Param('id') id: string) {
    return this.membershipsService.revokeInvite(tenant.id, id);
  }

  @Post('invites/:id/resend')
  @Roles('owner', 'manager')
  resendInvite(@CurrentTenant() tenant: Tenant, @Param('id') id: string) {
    return this.membershipsService.resendInvite(tenant.id, id);
  }

  @Patch(':id/role')
  @Roles('owner')
  updateRole(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() body: UpdateMemberRoleDto,
  ) {
    return this.membershipsService.updateRole(
      id,
      tenant.id,
      body.role,
      user.id,
    );
  }

  @Patch('transfer-ownership')
  @Roles('owner')
  transferOwnership(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: { id: string },
    @Body() body: TransferOwnershipDto,
  ) {
    return this.membershipsService.transferOwnership(
      tenant.id,
      user.id,
      body.membershipId,
    );
  }

  @Delete(':id')
  @Roles('owner')
  remove(
    @CurrentTenant() tenant: Tenant,
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    return this.membershipsService.remove(id, tenant.id, user.id);
  }
}
