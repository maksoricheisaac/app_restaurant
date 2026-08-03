import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('/menu')
@UseGuards(AuthGuard, RolesGuard)
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  // Ces deux routes portaient un @Public() hérité de l'époque où la carte
  // publique passait encore par ce contrôleur. En pratique elles restaient
  // fermées : le service exigeait un tenantId, absent pour un appel anonyme,
  // et renvoyait donc une 403. Ce filet disparaissant avec le multi-tenant,
  // le @Public() serait devenu réel — exposant la carte d'administration,
  // articles indisponibles compris. La carte destinée aux clients est servie
  // par /public-menu, qui ne renvoie que ce qui est effectivement vendable.
  @Get()
  @Roles('owner', 'manager', 'chef', 'waiter', 'cashier')
  findAll(
    @Query() query: PaginationQueryDto,
    @Query('availableOnly') availableOnly: string,
  ) {
    return this.menuService.findAll(query, availableOnly === 'true');
  }

  /**
   * Carte complète du poste de caisse, options comprises. Déclarée avant
   * `:id` — sans quoi Nest interpréterait « pos-catalogue » comme un
   * identifiant d'article.
   */
  @Get('pos-catalogue')
  @Roles('owner', 'manager', 'chef', 'waiter', 'cashier')
  findPosCatalogue() {
    return this.menuService.findPosCatalogue();
  }

  @Get(':id')
  @Roles('owner', 'manager', 'chef', 'waiter', 'cashier')
  findOne(@Param('id') id: string) {
    return this.menuService.findOne(id);
  }

  @Post()
  @Roles('owner', 'manager', 'chef')
  create(@Body() data: CreateMenuItemDto) {
    return this.menuService.create(data);
  }

  @Patch(':id')
  @Roles('owner', 'manager', 'chef')
  update(@Param('id') id: string, @Body() data: UpdateMenuItemDto) {
    return this.menuService.update(id, data);
  }

  @Delete(':id')
  @Roles('owner', 'manager', 'chef')
  remove(@Param('id') id: string) {
    return this.menuService.remove(id);
  }
}
