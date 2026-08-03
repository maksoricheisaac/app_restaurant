import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { MenuOptionsService } from './menu-options.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CreateOptionGroupDto,
  UpdateOptionGroupDto,
  CreateOptionDto,
  UpdateOptionDto,
} from './dto/menu-option.dto';

/**
 * Gestion admin des options de plats. Préfixe dédié `/menu-options` pour éviter
 * toute ambiguïté de routing avec `GET /menu/:id`.
 */
@Controller('/menu-options')
@UseGuards(AuthGuard, RolesGuard)
export class MenuOptionsController {
  constructor(private readonly service: MenuOptionsService) {}

  @Get('item/:menuItemId')
  @Roles('owner', 'manager', 'chef')
  listForItem(@Param('menuItemId') menuItemId: string) {
    return this.service.listForItem(menuItemId);
  }

  @Post('groups')
  @Roles('owner', 'manager', 'chef')
  createGroup(@Body() dto: CreateOptionGroupDto) {
    return this.service.createGroup(dto);
  }

  @Patch('groups/:id')
  @Roles('owner', 'manager', 'chef')
  updateGroup(@Param('id') id: string, @Body() dto: UpdateOptionGroupDto) {
    return this.service.updateGroup(id, dto);
  }

  @Delete('groups/:id')
  @Roles('owner', 'manager', 'chef')
  removeGroup(@Param('id') id: string) {
    return this.service.removeGroup(id);
  }

  @Post('options')
  @Roles('owner', 'manager', 'chef')
  createOption(@Body() dto: CreateOptionDto) {
    return this.service.createOption(dto);
  }

  @Patch('options/:id')
  @Roles('owner', 'manager', 'chef')
  updateOption(@Param('id') id: string, @Body() dto: UpdateOptionDto) {
    return this.service.updateOption(id, dto);
  }

  @Delete('options/:id')
  @Roles('owner', 'manager', 'chef')
  removeOption(@Param('id') id: string) {
    return this.service.removeOption(id);
  }
}
