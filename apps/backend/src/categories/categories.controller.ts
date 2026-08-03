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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('/categories')
@UseGuards(AuthGuard, RolesGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Post()
  @Roles('owner', 'manager', 'chef')
  create(@Body() data: CreateCategoryDto) {
    return this.categoriesService.create(data);
  }

  @Patch(':id')
  @Roles('owner', 'manager', 'chef')
  update(@Param('id') id: string, @Body() data: CreateCategoryDto) {
    return this.categoriesService.update(id, data);
  }

  @Delete(':id')
  @Roles('owner', 'manager', 'chef')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
