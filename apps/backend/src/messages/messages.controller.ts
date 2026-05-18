import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto, UpdateMessageDto } from './dto/messages.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentTenant } from '../common/decorators/current-tenant.decorator';
import type { Tenant } from '@prisma/client';

@Controller('/messages')
@UseGuards(AuthGuard, TenantGuard, RolesGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  @Roles('owner', 'manager')
  findAll(@CurrentTenant() tenant: Tenant) {
    return this.messagesService.findAll(tenant.id);
  }

  @Get(':id')
  @Roles('owner', 'manager')
  findOne(@CurrentTenant() tenant: Tenant, @Param('id') id: string) {
    return this.messagesService.findOne(tenant.id, id);
  }

  @Public()
  @Post()
  create(@CurrentTenant() tenant: Tenant, @Body() data: CreateMessageDto) {
    return this.messagesService.create(tenant.id, data);
  }

  @Patch(':id')
  @Roles('owner', 'manager')
  update(
    @CurrentTenant() tenant: Tenant,
    @Param('id') id: string,
    @Body() data: UpdateMessageDto,
  ) {
    return this.messagesService.update(tenant.id, id, data);
  }

  @Delete(':id')
  @Roles('owner', 'manager')
  remove(@CurrentTenant() tenant: Tenant, @Param('id') id: string) {
    return this.messagesService.remove(tenant.id, id);
  }
}
