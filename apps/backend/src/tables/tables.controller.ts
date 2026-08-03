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
import { TablesService } from './tables.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('/tables')
@UseGuards(AuthGuard, RolesGuard)
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get()
  @Roles('owner', 'manager', 'waiter', 'cashier')
  findAll() {
    return this.tablesService.findAll();
  }

  @Get('locations')
  @Roles('owner', 'manager', 'waiter', 'cashier')
  findLocations() {
    return this.tablesService.findLocations();
  }

  @Post()
  @Roles('owner', 'manager')
  create(@Body() data: CreateTableDto) {
    return this.tablesService.create(data);
  }

  @Patch(':id')
  @Roles('owner', 'manager')
  update(@Param('id') id: string, @Body() data: UpdateTableDto) {
    return this.tablesService.update(id, data);
  }

  @Delete(':id')
  @Roles('owner', 'manager')
  remove(@Param('id') id: string) {
    return this.tablesService.remove(id);
  }
}
