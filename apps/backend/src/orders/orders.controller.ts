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
import { OrderLineStatus } from '@prisma/client';
import { OrdersService } from './orders.service';
import { OrderTicketService } from './order-ticket.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderFiltersDto } from './dto/order-filters.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import {
  AddOrderLinesDto,
  AdvanceOrderLineDto,
  UpdateOrderLineDto,
  VoidOrderLineDto,
} from './dto/ticket.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

/** Rôles autorisés à composer un ticket en salle ou au comptoir. */
const ORDER_TAKERS = ['owner', 'manager', 'waiter', 'cashier'] as const;

@Controller('/orders')
@UseGuards(AuthGuard, RolesGuard)
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly ticketService: OrderTicketService,
  ) {}

  @Get()
  @Roles('owner', 'manager', 'waiter', 'cashier', 'chef')
  findAll(@Query() filters: OrderFiltersDto) {
    return this.ordersService.findAll(filters);
  }

  /**
   * Tickets encore ouverts. Déclaré avant `:id` — sans quoi Nest lirait
   * « open » comme un identifiant de commande.
   */
  @Get('open')
  @Roles(...ORDER_TAKERS)
  findOpen() {
    return this.ticketService.findOpen();
  }

  /**
   * Écran cuisine (KDS) — lignes parties, en préparation ou prêtes.
   */
  @Get('kitchen')
  @Roles('owner', 'manager', 'chef')
  getKitchenOrders() {
    return this.ordersService.findKitchenOrders();
  }

  @Get(':id')
  @Roles('owner', 'manager', 'waiter', 'cashier', 'chef')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Post()
  @Roles(...ORDER_TAKERS)
  create(@Body() data: CreateOrderDto, @CurrentUser() user: any) {
    return this.ordersService.create(data, user?.id);
  }

  // ─── Vie du ticket ────────────────────────────────────────────────────────

  /** Ajoute une tournée à un ticket ouvert. */
  @Post(':id/lines')
  @Roles(...ORDER_TAKERS)
  addLines(
    @Param('id') id: string,
    @Body() dto: AddOrderLinesDto,
    @CurrentUser() user: any,
  ) {
    return this.ticketService.addLines(
      id,
      dto.items,
      { sendImmediately: dto.sendImmediately },
      user,
    );
  }

  /** Corrige la quantité d'une ligne encore en brouillon. */
  @Patch(':id/lines/:lineId')
  @Roles(...ORDER_TAKERS)
  updateLine(
    @Param('id') id: string,
    @Param('lineId') lineId: string,
    @Body() dto: UpdateOrderLineDto,
    @CurrentUser() user: any,
  ) {
    return this.ticketService.updateDraftLineQuantity(
      id,
      lineId,
      dto.quantity,
      user,
    );
  }

  /** Retire une ligne encore en brouillon. */
  @Delete(':id/lines/:lineId')
  @Roles(...ORDER_TAKERS)
  removeLine(
    @Param('id') id: string,
    @Param('lineId') lineId: string,
    @CurrentUser() user: any,
  ) {
    return this.ticketService.removeDraftLine(id, lineId, user);
  }

  /**
   * Annule une ligne déjà partie en cuisine. Réservé à l'encadrement : c'est
   * une perte de marchandise, et le principal vecteur de démarque d'un POS.
   */
  @Post(':id/lines/:lineId/void')
  @Roles('owner', 'manager')
  voidLine(
    @Param('id') id: string,
    @Param('lineId') lineId: string,
    @Body() dto: VoidOrderLineDto,
    @CurrentUser() user: any,
  ) {
    return this.ticketService.voidLine(id, lineId, dto.reason, user);
  }

  /** Envoie en cuisine toutes les lignes en attente. */
  @Post(':id/send')
  @Roles(...ORDER_TAKERS)
  sendToKitchen(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ticketService.sendToKitchen(id, user);
  }

  /** Avancement d'une ligne depuis l'écran cuisine. */
  @Patch(':id/lines/:lineId/status')
  @Roles('owner', 'manager', 'waiter', 'chef')
  advanceLine(
    @Param('id') id: string,
    @Param('lineId') lineId: string,
    @Body() dto: AdvanceOrderLineDto,
    @CurrentUser() user: any,
  ) {
    return this.ticketService.advanceLine(
      id,
      lineId,
      dto.status as unknown as OrderLineStatus,
      user,
    );
  }

  /** Avancement de tout le ticket — annulation comprise, avec motif. */
  @Patch(':id/status')
  @Roles('owner', 'manager', 'waiter', 'chef')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.updateStatus(id, dto, user);
  }

  @Delete(':id')
  @Roles('owner', 'manager')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }

  @Public()
  @Get(':id/tracking')
  getTracking(@Param('id') id: string) {
    return this.ordersService.getTracking(id);
  }
}
