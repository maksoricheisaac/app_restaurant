import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto, UpdateMessageDto } from './dto/messages.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { PageQueryDto } from '../common/dto/page-query.dto';

@Controller('/messages')
@UseGuards(AuthGuard, RolesGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  @Roles('owner', 'manager')
  findAll(
    @Query('period') period?: string,
    @Query('date') date?: string,
    @Query('status') status?: string,
    @Query() { page, limit }: PageQueryDto = {},
  ) {
    return this.messagesService.findAll({
      period,
      date,
      status,
      page,
      limit,
    });
  }

  @Get(':id')
  @Roles('owner', 'manager')
  findOne(@Param('id') id: string) {
    return this.messagesService.findOne(id);
  }

  @Public()
  @Post()
  create(@Body() data: CreateMessageDto) {
    return this.messagesService.create(data);
  }

  @Patch(':id')
  @Roles('owner', 'manager')
  update(@Param('id') id: string, @Body() data: UpdateMessageDto) {
    return this.messagesService.update(id, data);
  }

  @Delete(':id')
  @Roles('owner', 'manager')
  remove(@Param('id') id: string) {
    return this.messagesService.remove(id);
  }
}
