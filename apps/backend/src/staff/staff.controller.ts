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
import { StaffService } from './staff.service';
import {
  InviteStaffDto,
  CreateStaffDto,
  UpdateStaffDto,
  TransferOwnershipDto,
} from './dto/staff.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('/staff')
@UseGuards(AuthGuard, RolesGuard)
export class StaffController {
  constructor(private readonly staff: StaffService) {}

  @Get()
  @Roles('owner', 'manager')
  findAll() {
    return this.staff.findAll();
  }

  @Post()
  @Roles('owner', 'manager')
  create(@Body() data: CreateStaffDto) {
    return this.staff.create(data);
  }

  @Patch('transfer-ownership')
  @Roles('owner')
  transferOwnership(
    @CurrentUser() user: { id: string },
    @Body() body: TransferOwnershipDto,
  ) {
    return this.staff.transferOwnership(user.id, body.userId);
  }

  @Post('invites')
  @Roles('owner', 'manager')
  invite(@CurrentUser() user: { id: string }, @Body() body: InviteStaffDto) {
    return this.staff.invite(user.id, body);
  }

  @Get('invites')
  @Roles('owner', 'manager')
  listInvites() {
    return this.staff.listInvites();
  }

  @Delete('invites/:id')
  @Roles('owner', 'manager')
  revokeInvite(@Param('id') id: string) {
    return this.staff.revokeInvite(id);
  }

  @Post('invites/:id/resend')
  @Roles('owner', 'manager')
  resendInvite(@Param('id') id: string) {
    return this.staff.resendInvite(id);
  }

  @Patch(':id')
  @Roles('owner', 'manager')
  update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() data: UpdateStaffDto,
  ) {
    return this.staff.update(id, data, user.id);
  }

  @Delete(':id')
  @Roles('owner')
  remove(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.staff.remove(id, user.id);
  }
}
